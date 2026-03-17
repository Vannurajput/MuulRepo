/**
 * PrintConnector.js
 * Orchestrates receipt printing — delegates receipt generation, byte building,
 * and transport to dedicated modules.
 *
 * Architecture:
 *   Payload → ReceiptBuilder → lines/html
 *                                ↓
 *                       EscPosBuilder (unified)
 *                      ┌─────────┴──────────┐
 *                Command Mode          Graphic Mode
 *                      └─────────┬──────────┘
 *                           raw bytes (Buffer)
 *                                ↓
 *                  TcpTransport / BleTransport / SystemPrintBridge
 */
const { execSync } = require('child_process');
const log = require('../../logger');
const credentialRegistry = require('../credentialRegistry');
const { buildPrinterJobs } = require('./helpers/printPayloadSplitter');

// Modular printer components
const { buildReceiptLines, buildReceiptHtml, escapeHtml, generateQRSVG, generateCode128SVG } = require('./printer/ReceiptBuilder');
const { inlineLogoInPayload, fetchToDataUrl, processImageForBW } = require('./printer/imageUtils');
const EscPosBuilder = require('./printer/EscPosBuilder');
const TcpTransport = require('./printer/transports/TcpTransport');
const BleTransport = require('./printer/transports/BleTransport');
const SystemPrintBridge = require('./printer/SystemPrintBridge');
const PdfPrintPipeline = require('./printer/PdfPrintPipeline');

/* ---------- Resolve Windows printer name from network IP ---------- */
function findWindowsPrinterByPort(ip) {
  if (!ip) return null;
  try {
    const safeIp = ip.replace(/"/g, '`"');
    const psScript = `Get-Printer | Where-Object { $_.PortName -like "*${safeIp}*" } | Select-Object Name | ConvertTo-Json -Compress`;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    const raw = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true
    });
    if (!raw || !raw.trim()) return null;
    let printers = JSON.parse(raw.trim());
    if (!Array.isArray(printers)) printers = [printers];
    const name = printers[0]?.Name || null;
    if (name) log.info(`[PrintConnector] resolved Windows printer "${name}" for IP ${ip}`);
    return name;
  } catch (err) {
    log.warn('[PrintConnector] findWindowsPrinterByPort failed:', err.message);
    return null;
  }
}

/* ---------- Main connector ---------- */
class PrintConnector {
  async lookupPrinterConfig(payload = {}) {
    if (payload.printerId) {
      try {
        const entry = await credentialRegistry.get('printer', payload.printerId);
        if (entry) return entry;
      } catch (error) {
        log.warn('Failed to load printer config by id', error);
      }
    }
    const names = [];
    if (typeof payload.printer_name === 'string') {
      names.push(payload.printer_name.trim());
    } else if (Array.isArray(payload.printer_name)) {
      payload.printer_name.forEach((name) => {
        if (typeof name === 'string' && name.trim()) {
          names.push(name.trim());
        }
      });
    }

    if (!names.length) {
      try {
        const printers = await credentialRegistry.list('printer');
        if (!Array.isArray(printers) || !printers.length) {
          return null;
        }
        const sorted = [...printers].sort((a, b) => (b.updatedAt || b.modifiedAt || 0) - (a.updatedAt || a.modifiedAt || 0));
        return sorted[0] || null;
      } catch (error) {
        log.warn('Failed to auto-select default printer config', error);
        return null;
      }
    }

    try {
      const printers = await credentialRegistry.list('printer');
      return (
        printers.find((entry) => {
          const matcher = (entry.printerName || entry.deviceName || entry.label || '').trim();
          return matcher && names.some((name) => name.toLowerCase() === matcher.toLowerCase());
        }) || null
      );
    } catch (error) {
      log.warn('Failed to list printer configs', error);
      return null;
    }
  }

  static CUT_SEQUENCE = Buffer.from([0x1d, 0x56, 0x00]); // GS V full cut

  async printWithConfig(printerConfig, payload = {}, options = {}) {
    const printablePayload = await inlineLogoInPayload(payload);
    const isKitchenMode = options.isKitchen === true;

    // Determine Mode: 'text' or 'graphic'
    let useTextMode = false;
    const mode = (printerConfig.printMode || '').toLowerCase();
    const isNetworkType = printerConfig.printerType === 'network';
    const isBluetoothType = printerConfig.printerType === 'bluetooth';

    if (mode === 'text') {
      useTextMode = true;
    } else if (mode === 'graphic') {
      useTextMode = false;
    } else {
      // Legacy auto-detect (Network=Text, System=Graphic)
      useTextMode = isNetworkType;
    }

    // --- NETWORK PRINTER (TCP) ---
    if (isNetworkType && printerConfig.printerName) {
      const windowsName = findWindowsPrinterByPort(printerConfig.printerName);
      if (windowsName) {
        // Windows driver found — use system print path
        printerConfig.deviceName = windowsName;
        log.info(`[PrintConnector] network printer: using Windows name "${windowsName}" for IP ${printerConfig.printerName}`);
        // Fall through to system print path below
      } else {
        // No Windows printer found — use TCP socket with unified ESC/POS
        log.info(`[PrintConnector] network printer: using TCP socket for IP ${printerConfig.printerName}`);

        const linesResult = buildReceiptLines(printablePayload, { kitchenMode: isKitchenMode });
        const logoBlock = printablePayload.data.find(b => b.type === 'logo' && b.data?.url);
        const logoUrl = logoBlock?.data?.url || null;

        let buffer;
        if (useTextMode || mode !== 'graphic') {
          // Command mode (default for TCP)
          buffer = await EscPosBuilder.buildCommandMode(linesResult, { logoUrl });
        } else {
          // Graphic mode for TCP
          buffer = await EscPosBuilder.buildGraphicMode(printablePayload, printerConfig, { kitchenMode: isKitchenMode });
        }

        try {
          await TcpTransport.send(printerConfig.printerName, printerConfig.printerPort || 9100, buffer);
          log.info('[PrintConnector] network print sent', { printer: printerConfig.printerName });
          return { ok: true, printed: true, method: 'network-tcp' };
        } catch (error) {
          log.error('[PrintConnector] network socket print failed', error);
          return { ok: false, error: 'network_print_failed' };
        }
      }
    }

    // --- BLUETOOTH PRINTER (BLE) ---
    if (isBluetoothType && printerConfig.deviceAddress) {
      log.info(`[PrintConnector] bluetooth printer: using BLE for ${printerConfig.deviceAddress}`);

      const linesResult = buildReceiptLines(printablePayload, { kitchenMode: isKitchenMode });
      const logoBlock = Array.isArray(printablePayload.data)
        ? printablePayload.data.find(b => b.type === 'logo' && b.data?.url)
        : null;
      const logoUrl = logoBlock?.data?.url || null;

      let buffer;
      if (useTextMode) {
        buffer = await EscPosBuilder.buildCommandMode(linesResult, { logoUrl });
      } else {
        buffer = await EscPosBuilder.buildGraphicMode(printablePayload, printerConfig, { kitchenMode: isKitchenMode });
      }

      try {
        await BleTransport.send(printerConfig.deviceAddress, buffer);
        log.info('[PrintConnector] BLE print sent', { device: printerConfig.deviceAddress });
        return { ok: true, printed: true, method: 'bluetooth-ble' };
      } catch (error) {
        log.error('[PrintConnector] BLE print failed', error);
        return { ok: false, error: 'bluetooth_print_failed' };
      }
    }

    // --- SYSTEM PRINTER (Electron Window) ---
    // Handles USB, Bluetooth (paired via OS), and network printers with Windows drivers
    let html = '';
    if (useTextMode) {
      // User wants Text look on a System driver — build system-text HTML
      const linesResult = buildReceiptLines(printablePayload, { kitchenMode: isKitchenMode });
      const textLines = linesResult.lines;
      const boldSet = linesResult.boldLineIndices;
      const txtStylesMap = linesResult.lineStyles || {};
      const txtImgInserts = linesResult.imageInserts || {};

      // Logo handling for system text mode
      let logoHtml = '';
      const logoBlock = Array.isArray(printablePayload.data)
        ? printablePayload.data.find((b) => b?.type === 'logo' && b.data?.url)
        : null;

      if (logoBlock) {
        log.info('[PrintConnector] processing logo for system-text-mode...');
        let logoSrc = null;
        if (logoBlock.data.url && logoBlock.data.url.startsWith('data:')) {
          logoSrc = logoBlock.data.url;
        } else {
          logoSrc = await fetchToDataUrl(logoBlock.data.url);
        }

        let processedUrl = null;
        if (isNetworkType) {
          processedUrl = await processImageForBW(logoSrc || logoBlock.data.url);
        } else {
          if (logoSrc) {
            processedUrl = logoSrc;
          } else {
            processedUrl = await processImageForBW(logoBlock.data.url);
          }
        }

        if (processedUrl) {
          logoHtml = `
            <div class="logo">
              <img src="${escapeHtml(processedUrl)}" alt="Logo">
            </div>
          `;
        }
      }

      const sysLineWidth = Number(printablePayload && printablePayload.item_length) || 42;
      const sysPrintMm = 80;
      const sysContentMm = sysPrintMm - 6;
      const sysFontMm = (sysContentMm / (sysLineWidth * 0.65)).toFixed(2);

      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            html, body { margin: 0; padding: 0; }
            body {
              font-family: 'Courier New', monospace;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-size: ${sysFontMm}mm;
              background: #fff;
            }
            .paper {
              width: 80mm;
              margin: 0;
              padding: 3mm 2mm 3mm 4mm;
              box-sizing: border-box;
              overflow: hidden;
            }
            .logo {
              display: block;
              width: 100%;
              text-align: center;
              margin-bottom: 2mm;
            }
            .logo img {
              max-width: ${isNetworkType ? '45%' : '65%'};
              max-height: ${isNetworkType ? '12mm' : '20mm'};
              height: auto;
              display: inline-block;
            }
            .text-content { white-space: pre; line-height: 1.2; }
            .remark-line { white-space: pre-wrap; word-wrap: break-word; line-height: 1.2; margin: 0; }
            .top-title { text-align: center; font-weight: bold; font-size: 1.8em; line-height: 1.2; margin-bottom: 1mm; }
            .qr-barcode { margin: 2mm 0; } .qr-barcode svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="paper">
            ${logoHtml}
            ${linesResult.topTitle ? '<div class="top-title">' + escapeHtml(linesResult.topTitle) + '</div>' : ''}
            ${(function() {
              var out = '';
              var inTxt = false;
              for (var ti = 0; ti < textLines.length; ti++) {
                var tImg = txtImgInserts[ti];
                if (tImg) {
                  if (inTxt) { out += '</div>'; inTxt = false; }
                  var tImgAlign = (tImg.align || 'center').toLowerCase();
                  var tImgSvg = tImg.type === 'qr' ? generateQRSVG(tImg.data) : generateCode128SVG(tImg.data);
                  if (tImgSvg) {
                    out += '<div class="qr-barcode" style="text-align:' + tImgAlign + '">' + tImgSvg + '</div>';
                  }
                  continue;
                }
                var esc = escapeHtml(textLines[ti]);
                var ls = txtStylesMap[ti];
                var hasSz = ls && (String(ls.length || '').toLowerCase() === 'large' || String(ls.length || '').toLowerCase() === 'medium');
                if (hasSz) {
                  if (inTxt) { out += '</div>'; inTxt = false; }
                  var rs = '';
                  var sv = String(ls.length || '').toLowerCase();
                  if (sv === 'large') rs += 'font-size:1.6em;';
                  else if (sv === 'medium') rs += 'font-size:1.3em;';
                  if (ls.italic) rs += 'font-style:italic;';
                  if (ls.bold || boldSet[ti]) rs += 'font-weight:bold;';
                  out += '<div class="remark-line" style="' + rs + '">' + esc + '</div>';
                } else {
                  if (!inTxt) { out += '<div class="text-content">'; inTxt = true; }
                  var inl = '';
                  if (ls) {
                    if (ls.italic) inl += 'font-style:italic;';
                    if (ls.bold) inl += 'font-weight:bold;';
                  }
                  if (boldSet[ti] || (ls && ls.bold)) {
                    out += (inl ? '<b style="' + inl + '">' : '<b>') + esc + '</b>\n';
                  } else if (inl) {
                    out += '<span style="' + inl + '">' + esc + '</span>\n';
                  } else {
                    out += esc + '\n';
                  }
                }
              }
              if (inTxt) out += '</div>';
              return out;
            })()}
          </div>
        </body>
        </html>`;
      log.debug('[PrintConnector] generated simulated text-mode HTML with logo');
    } else {
      // Graphic Mode (Standard)
      html = buildReceiptHtml(printablePayload, { kitchenMode: isKitchenMode });
      log.debug('[PrintConnector] generated graphic-mode HTML');
    }

    const deviceName = printerConfig.deviceName || printerConfig.printerName;
    if (!deviceName) {
      log.error('[PrintConnector] printer configuration missing device name', printerConfig);
      return { ok: false, error: 'printer_config_missing' };
    }

    return await SystemPrintBridge.print(html, deviceName);
  }

  async executePdfPrint(payload) {
    const pdfUrl = payload.url || payload.payload?.url;
    log.info(`[PrintConnector] PDF print requested: ${pdfUrl}`);

    const printerConfig = await this.lookupPrinterConfig(payload);
    if (!printerConfig) {
      log.error('[PrintConnector] no saved printer configuration found for PDF print');
      return { ok: false, error: 'printer_config_missing' };
    }

    const isNetworkType = printerConfig.printerType === 'network';

    if (isNetworkType && printerConfig.printerName) {
      // Network printer → ESC/POS raster via TCP
      try {
        const buffer = await PdfPrintPipeline.buildPdfEscPos(pdfUrl);
        await TcpTransport.send(printerConfig.printerName, printerConfig.printerPort || 9100, buffer);
        log.info('[PrintConnector] PDF sent to network printer via TCP');
        return { ok: true, printed: true, method: 'network-tcp-pdf' };
      } catch (error) {
        log.error('[PrintConnector] PDF network print failed', error);
        return { ok: false, error: error?.message || 'pdf_network_print_failed' };
      }
    }

    // System printer (USB, paired Bluetooth, Windows driver)
    const deviceName = printerConfig.deviceName || printerConfig.printerName;
    return PdfPrintPipeline.printPdfViaSystem(pdfUrl, deviceName);
  }

  async execute(payload = {}) {
    log.info('[PrintConnector] execute called with payload');
    if (!payload || typeof payload !== 'object') {
      log.error('[PrintConnector] invalid or missing payload:', payload);
      throw new Error('PrintConnector: invalid payload');
    }

    // Detect PDF payload (remote URL or base64 data URL)
    const pdfUrl = payload.pdfDataUrl || payload.url || payload.payload?.pdfDataUrl || payload.payload?.url;
    if (pdfUrl && (pdfUrl.startsWith('data:application/pdf') || /\.pdf(\?|#|$)/i.test(pdfUrl))) {
      return this.executePdfPrint({ ...payload, url: pdfUrl });
    }

    try {
      let printerConfigs = [];
      try {
        const listed = await credentialRegistry.list('printer');
        if (Array.isArray(listed)) printerConfigs = listed;
      } catch (_) {}

      const printerConfig = await this.lookupPrinterConfig(payload);

      if (!printerConfig) {
        const { collectPrinterNamesFromPayload, buildFilteredPayload, getConfigNames } = require('./helpers/printPayloadSplitter');
        const allNames = collectPrinterNamesFromPayload(payload);
        const kitchenJobs = [];

        for (const config of printerConfigs) {
          const configNames = getConfigNames(config);
          const matchName = configNames.find((n) => allNames.has(n));
          if (!matchName) continue;
          const filteredPayload = buildFilteredPayload(payload, matchName);
          if (!filteredPayload) continue;
          kitchenJobs.push({ config, payload: filteredPayload, targetName: matchName });
        }

        if (!kitchenJobs.length) {
          log.error('[PrintConnector] no saved printer configuration found for payload');
          return { ok: false, error: 'printer_config_missing' };
        }

        log.info(`[PrintConnector] top-level printer not found, printing ${kitchenJobs.length} kitchen-only ticket(s)`);
        const results = [];
        for (const job of kitchenJobs) {
          const cfg = { ...job.config };
          const res = await this.printWithConfig(cfg, job.payload, { isKitchen: true });
          results.push({
            targetPrinter: job.targetName || cfg.printerName || cfg.deviceName || '',
            ...res
          });
        }
        if (results.length === 1) return results[0];
        const allOk = results.every((r) => r && r.ok !== false);
        return { ok: allOk, results };
      }

      // Primary config matched — full receipt + kitchen tickets for other printers
      const jobs = buildPrinterJobs({ payload, primaryConfig: printerConfig, printerConfigs });
      if (!jobs.length) {
        return await this.printWithConfig({ ...printerConfig }, payload);
      }

      const results = [];
      for (const job of jobs) {
        const cfg = { ...job.config };
        const res = await this.printWithConfig(cfg, job.payload, { isKitchen: !job.fullReceipt });
        results.push({
          targetPrinter: job.targetName || cfg.printerName || cfg.deviceName || '',
          ...res
        });
      }

      if (results.length === 1) return results[0];
      const allOk = results.every((r) => r && r.ok !== false);
      return { ok: allOk, results };
    } catch (err) {
      log.error('[PrintConnector] execute failed:', err);
      return { ok: false, error: err?.message || 'print_execute_failed' };
    }
  }
}

module.exports = PrintConnector;

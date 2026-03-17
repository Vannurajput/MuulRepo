/**
 * UsbPrinterConnector.js
 * Lists installed printers using Windows PowerShell Get-Printer command.
 * Shows real printer names that work with the Windows print spooler.
 */
const { execSync } = require('child_process');
const log = require('../../logger');

/**
 * List all installed printers using Windows PowerShell (Get-Printer).
 * Returns { devices: [...], diagnostics: [...] }.
 */
function listDevices() {
  const diagnostics = [];

  try {
    diagnostics.push('Scanning printers via PowerShell Get-Printer...');
    log.info('[UsbPrinter] scanning printers via PowerShell Get-Printer');

    const psScript = 'Get-Printer | Select-Object Name, PortName, Type, DriverName, PrinterStatus | ConvertTo-Json -Compress';
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    const raw = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      encoding: 'utf8',
      timeout: 15000,
      windowsHide: true
    });

    if (!raw || !raw.trim()) {
      diagnostics.push('PowerShell returned empty output');
      return { devices: [], diagnostics };
    }

    let parsed = JSON.parse(raw.trim());
    if (!Array.isArray(parsed)) parsed = [parsed];

    diagnostics.push(`Get-Printer returned ${parsed.length} printer(s)`);
    log.info(`[UsbPrinter] Get-Printer returned ${parsed.length} printer(s)`);

    const result = [];
    for (const p of parsed) {
      const name = p.Name || 'Unknown Printer';
      const port = p.PortName || '';
      const driver = p.DriverName || '';
      const status = p.PrinterStatus;

      const label = `${name} (${port})`;
      diagnostics.push(`Found: ${label} driver=${driver} status=${status}`);
      log.info(`[UsbPrinter] found printer: ${label}`);

      result.push({
        vendorId: name,
        productId: port,
        label,
        printerName: name,
        portName: port,
        driverName: driver
      });
    }

    diagnostics.push(`Result: ${result.length} printer(s) listed`);
    log.info(`[UsbPrinter] scan complete: ${result.length} printer(s) listed`);
    return { devices: result, diagnostics };
  } catch (err) {
    log.error('[UsbPrinter] PowerShell scan failed:', err);
    diagnostics.push(`Scan failed: ${err.message}`);
    return { devices: [], diagnostics };
  }
}

/**
 * Check real connectivity status of a printer by name.
 * Uses Get-Printer to check PrinterStatus.
 * Returns { online: boolean, status: string }.
 */
function checkStatus(printerName) {
  if (!printerName) return { online: false, status: 'No printer name' };

  try {
    const safeName = String(printerName).replace(/[`"$]/g, '');
    const psScript = `Get-Printer -Name "${safeName}" | Select-Object PrinterStatus | ConvertTo-Json -Compress`;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    const raw = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true
    });

    if (!raw || !raw.trim()) {
      return { online: false, status: 'Printer not found' };
    }

    const parsed = JSON.parse(raw.trim());
    const statusCode = parsed.PrinterStatus;
    log.info(`[UsbPrinter] status check: ${printerName} = ${statusCode}`);

    // PrinterStatus values from Windows:
    // 0=Normal, 1=Paused, 2=Error, 3=PendingDeletion,
    // 4=PaperJam, 5=PaperOut, 6=ManualFeed, 7=PaperProblem
    // 4096=Processing (busy but working), 1048578=Offline+Error
    const errorStatuses = [2, 3, 4, 5, 6, 7];
    const isError = errorStatuses.includes(statusCode) || statusCode >= 1048576;
    if (statusCode === 1) {
      return { online: false, status: 'Printer paused' };
    } else if (isError) {
      return { online: false, status: 'Printer offline' };
    } else {
      return { online: true, status: 'Printer connected' };
    }
  } catch (err) {
    log.warn(`[UsbPrinter] status check failed for ${printerName}:`, err.message);
    return { online: false, status: 'Printer not found' };
  }
}

module.exports = { listDevices, checkStatus };

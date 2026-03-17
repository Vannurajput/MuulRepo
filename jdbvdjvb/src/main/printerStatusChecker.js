/**
 * printerStatusChecker.js
 * Real physical connectivity checks for USB, Network, and Bluetooth printers.
 *
 * Two-step approach for USB/Bluetooth:
 *   Step 1: Get-Printer → find the real Windows printer matching the config's model/driver
 *   Step 2: Get-PnPDevice → check if that real printer is physically connected
 */
const net = require('net');
const { execSync } = require('child_process');
const log = require('../logger');

const SOCKET_TIMEOUT_MS = 4000;
const PS_TIMEOUT_MS = 10000;

/**
 * Network printer: try opening a TCP socket to ip:port.
 * If the socket connects, the printer is physically reachable.
 */
function checkNetworkPrinter(ip, port = 9100) {
  return new Promise((resolve) => {
    if (!ip) {
      resolve({ online: false, status: 'No printer IP' });
      return;
    }

    const socket = new net.Socket();
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(SOCKET_TIMEOUT_MS);

    socket.connect(Number(port) || 9100, ip, () => {
      log.info(`[PrinterStatus] Network printer ${ip}:${port} is reachable`);
      finish({ online: true, status: 'Printer connected' });
    });

    socket.on('error', (err) => {
      log.info(`[PrinterStatus] Network printer ${ip}:${port} unreachable: ${err.message}`);
      finish({ online: false, status: 'Printer not reachable' });
    });

    socket.on('timeout', () => {
      log.info(`[PrinterStatus] Network printer ${ip}:${port} timed out`);
      finish({ online: false, status: 'Printer not reachable' });
    });
  });
}

/**
 * Step 1: Find the real Windows printer by matching printerName from config
 * against the actual Windows Printer Name (from Get-Printer).
 * Only exact name match — no model/driver fallback.
 * Returns the real printer Name registered in Windows, or null.
 */
function findRealPrinterName(printerName) {
  if (!printerName) return null;

  try {
    const psScript = 'Get-Printer | Select-Object Name | ConvertTo-Json -Compress';
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    const raw = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      encoding: 'utf8',
      timeout: PS_TIMEOUT_MS,
      windowsHide: true
    });

    if (!raw || !raw.trim()) return null;
    let printers = JSON.parse(raw.trim());
    if (!Array.isArray(printers)) printers = [printers];

    const nameLower = printerName.toLowerCase();
    const match = printers.find((p) => (p.Name || '').toLowerCase() === nameLower);
    return match ? match.Name : null;
  } catch (err) {
    log.warn(`[PrinterStatus] Get-Printer failed:`, err.message);
    return null;
  }
}

/**
 * Step 2: Check if a real Windows printer is physically connected
 * using Get-PnPDevice with the exact printer name from Get-Printer.
 */
function checkPnPDeviceStatus(realPrinterName) {
  if (!realPrinterName) return { online: false, status: 'Printer not found' };

  try {
    const CLASSES = '"Printer","PrintQueue","Bluetooth","RemotePosDevice"';
    const safeName = realPrinterName.replace(/"/g, '`"');

    const psScript = `Get-PnPDevice | Where-Object { $_.FriendlyName -eq "${safeName}" -and ($_.Class -in @(${CLASSES})) } | Select-Object Status, FriendlyName, Class | ConvertTo-Json -Compress`;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    const raw = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      encoding: 'utf8',
      timeout: PS_TIMEOUT_MS,
      windowsHide: true
    });

    if (!raw || !raw.trim()) {
      // Exact match failed, try partial match with the real name
      return checkPnPDevicePartial(realPrinterName);
    }

    let devices = JSON.parse(raw.trim());
    if (!Array.isArray(devices)) devices = [devices];

    const match = devices.find((d) => d.Status === 'OK');
    if (match) {
      log.info(`[PrinterStatus] "${realPrinterName}" is physically connected (${match.Class})`);
      return { online: true, status: 'Printer connected' };
    }

    log.info(`[PrinterStatus] "${realPrinterName}" not physically connected (status: ${devices[0]?.Status})`);
    return { online: false, status: 'Printer disconnected' };
  } catch (err) {
    log.warn(`[PrinterStatus] PnP check failed for "${realPrinterName}":`, err.message);
    return { online: false, status: 'Printer not found' };
  }
}

/**
 * Fallback: partial match using Get-PnPDevice when exact name doesn't match.
 * Extracts model keyword (e.g. "TM-m30" from "EPSON TM-m30 Receipt") and
 * searches across Bluetooth/Printer/POS device classes.
 */
function checkPnPDevicePartial(realPrinterName) {
  try {
    const CLASSES = '"Printer","PrintQueue","Bluetooth","RemotePosDevice"';

    // Extract keywords that contain both letters and digits (model-like tokens)
    const tokens = realPrinterName.split(/[\s,]+/);
    const keywords = tokens.filter((t) => /[a-zA-Z]/.test(t) && /[\d-]/.test(t) && t.length >= 3);

    if (keywords.length === 0) {
      return { online: false, status: 'Printer not found' };
    }

    const conditions = keywords
      .map((k) => `$_.FriendlyName -like "*${k}*"`)
      .join(' -or ');

    const psScript = `Get-PnPDevice | Where-Object { (${conditions}) -and ($_.Class -in @(${CLASSES})) } | Select-Object Status, FriendlyName, Class | ConvertTo-Json -Compress`;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    const raw = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      encoding: 'utf8',
      timeout: PS_TIMEOUT_MS,
      windowsHide: true
    });

    if (!raw || !raw.trim()) {
      log.info(`[PrinterStatus] "${realPrinterName}" not found via partial PnP search`);
      return { online: false, status: 'Printer not found' };
    }

    let devices = JSON.parse(raw.trim());
    if (!Array.isArray(devices)) devices = [devices];

    const match = devices.find((d) => d.Status === 'OK');
    if (match) {
      log.info(`[PrinterStatus] "${realPrinterName}" matched "${match.FriendlyName}" — physically connected`);
      return { online: true, status: 'Printer connected' };
    }

    log.info(`[PrinterStatus] "${realPrinterName}" matched but not connected (status: ${devices[0]?.Status})`);
    return { online: false, status: 'Printer disconnected' };
  } catch (err) {
    log.warn(`[PrinterStatus] Partial PnP check failed:`, err.message);
    return { online: false, status: 'Printer not found' };
  }
}

/**
 * USB/Bluetooth printer check (two-step):
 *   1. Get-Printer: find real Windows printer name using printerModel (driver name)
 *   2. Get-PnPDevice: check if that real printer is physically connected
 */
function checkDevicePrinter(printerName) {
  if (!printerName) return { online: false, status: 'No printer name' };

  const realName = findRealPrinterName(printerName);
  if (!realName) {
    log.info(`[PrinterStatus] No Windows printer found matching name="${printerName}"`);
    return { online: false, status: 'Printer not found' };
  }

  log.info(`[PrinterStatus] Matched Windows printer "${realName}"`);
  return checkPnPDeviceStatus(realName);
}

/**
 * Router: pick the right physical check based on printerType.
 * @param {Object} config - { printerType, printerName, printerPort, printerModel }
 */
async function checkPrinterPhysical(config = {}) {
  const type = (config.printerType || '').toLowerCase();
  const name = config.printerName || config.deviceName || '';
  const port = config.printerPort || '9100';

  if (type.includes('network')) {
    return checkNetworkPrinter(name, port);
  }
  // USB and Bluetooth: printerName must match real Windows printer name
  return checkDevicePrinter(name);
}

module.exports = { checkPrinterPhysical, checkNetworkPrinter, checkDevicePrinter };

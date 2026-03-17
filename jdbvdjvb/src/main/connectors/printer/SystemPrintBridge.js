/**
 * SystemPrintBridge.js
 * Prints HTML receipts via the OS print spooler (Electron BrowserWindow.print).
 * Works for USB, Bluetooth (paired), and network printers that have Windows drivers.
 * Extracted from PrintConnector.js.
 */
const { BrowserWindow } = require('electron');
const log = require('../../../logger');

class SystemPrintBridge {
  /**
   * Render HTML in a hidden BrowserWindow and send it to the OS print spooler.
   * @param {string} html - Full HTML document string
   * @param {string} deviceName - OS printer device name
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  static async print(html, deviceName) {
    if (!deviceName) {
      log.error('[SystemPrintBridge] missing device name');
      return { ok: false, error: 'printer_config_missing' };
    }

    const win = new BrowserWindow({
      width: 480,
      height: 800,
      show: false,
      webPreferences: { sandbox: true }
    });

    const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    await new Promise((resolve, reject) => {
      const loadTimeout = setTimeout(() => reject(new Error('SystemPrintBridge: load timed out')), 15000);
      win.once('closed', () => { clearTimeout(loadTimeout); reject(new Error('SystemPrintBridge: window closed during load')); });
      win.webContents.once('did-finish-load', () => { clearTimeout(loadTimeout); resolve(); });
      win.webContents.once('did-fail-load', (_e, code, desc) => {
        clearTimeout(loadTimeout);
        reject(new Error(`SystemPrintBridge: failed to load HTML (${code}) ${desc}`));
      });
      win.loadURL(url);
    });

    // Wait for images (logo) to finish loading
    try {
      const waitImages = win.webContents.executeJavaScript(`
        const imgs = Array.from(document.images || []);
        if (!imgs.length) { return true; }
        return Promise.all(
          imgs.map((img) => {
            if (img.complete && img.naturalWidth > 0) return true;
            return new Promise((resolve) => {
              const done = () => resolve(true);
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            });
          })
        );
      `);
      const timeout = new Promise((resolve) => setTimeout(resolve, 4000));
      await Promise.race([waitImages, timeout]);
    } catch (_) {
      // ignore; continue to print
    }

    return await new Promise((resolve) => {
      win.webContents.print(
        {
          silent: true,
          deviceName,
          printBackground: true,
          pageSize: { width: 80000, height: 297000 },
          margins: { marginType: 'none' }
        },
        (success, reason) => {
          if (!win.isDestroyed()) win.close();
          if (!success) {
            log.error('[SystemPrintBridge] print failed:', reason || 'unknown');
            resolve({ ok: false, error: reason || 'print failed' });
          } else {
            log.info('[SystemPrintBridge] print job sent');
            resolve({ ok: true, printed: true, silent: true });
          }
        }
      );
    });
  }
}

module.exports = SystemPrintBridge;

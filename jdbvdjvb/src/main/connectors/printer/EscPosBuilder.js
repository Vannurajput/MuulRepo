/**
 * EscPosBuilder.js
 * Unified ESC/POS byte generator — produces the same Buffer regardless of transport.
 *
 * Two modes:
 *   1. Command mode — text-based ESC/POS from receipt lines (fast, small payload)
 *   2. Graphic mode — HTML → offscreen render → screenshot → monochrome raster (pixel-perfect)
 *
 * The returned Buffer can be sent via TcpTransport, BleTransport, or any future transport.
 */
const { BrowserWindow, nativeImage } = require('electron');
const log = require('../../../logger');
const { buildReceiptLines, buildReceiptHtml } = require('./ReceiptBuilder');
const { generateEscPosLogo, nativeImageToRaster } = require('./imageUtils');

/* ---------- ESC/POS command constants ---------- */
const ESC = 0x1b;
const GS  = 0x1d;

const CMD = {
  INIT:       Buffer.from([ESC, 0x40]),                 // ESC @ — initialize printer
  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]),           // ESC a 0
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),         // ESC a 1
  ALIGN_RIGHT: Buffer.from([ESC, 0x61, 0x02]),          // ESC a 2
  BOLD_ON:    Buffer.from([ESC, 0x45, 0x01]),            // ESC E 1
  BOLD_OFF:   Buffer.from([ESC, 0x45, 0x00]),            // ESC E 0
  FONT_NORMAL: Buffer.from([GS, 0x21, 0x00]),           // GS ! 0x00 — normal size
  FONT_DOUBLE: Buffer.from([GS, 0x21, 0x11]),           // GS ! 0x11 — double width+height
  FONT_WIDE:   Buffer.from([GS, 0x21, 0x10]),           // GS ! 0x10 — double width only
  FONT_TALL:   Buffer.from([GS, 0x21, 0x01]),           // GS ! 0x01 — double height only
  FEED_LINES: (n) => Buffer.from([ESC, 0x64, n & 0xff]),// ESC d n — feed n lines
  CUT:        Buffer.from([GS, 0x56, 0x00]),             // GS V 0 — full cut
  LF:         Buffer.from([0x0a])                        // line feed
};

class EscPosBuilder {
  /**
   * Command mode: build ESC/POS text commands from receipt lines.
   * @param {object} linesResult - Output from ReceiptBuilder.buildReceiptLines()
   * @param {object} opts
   * @param {string} [opts.logoUrl] - Logo data URL or http URL for raster logo
   * @returns {Promise<Buffer>}
   */
  static async buildCommandMode(linesResult, opts = {}) {
    const parts = [CMD.INIT];

    // Logo (raster) if provided
    if (opts.logoUrl) {
      try {
        const logoTimeout = new Promise((resolve) => setTimeout(() => {
          log.warn('[EscPosBuilder] logo generation timed out after 8s');
          resolve(Buffer.alloc(0));
        }, 8000));
        const logoBytes = await Promise.race([generateEscPosLogo(opts.logoUrl), logoTimeout]);
        if (logoBytes && logoBytes.length > 0) {
          parts.push(CMD.ALIGN_CENTER);
          parts.push(logoBytes);
          parts.push(CMD.ALIGN_LEFT);
        }
      } catch (err) {
        log.warn('[EscPosBuilder] logo generation failed, skipping', err.message);
      }
    }

    // Top title (centered, bold, double size)
    if (linesResult.topTitle) {
      parts.push(CMD.ALIGN_CENTER);
      parts.push(CMD.BOLD_ON);
      parts.push(CMD.FONT_DOUBLE);
      parts.push(Buffer.from(String(linesResult.topTitle), 'utf8'));
      parts.push(CMD.LF);
      parts.push(CMD.FONT_NORMAL);
      parts.push(CMD.BOLD_OFF);
      parts.push(CMD.ALIGN_LEFT);
    }

    const lines = linesResult.lines || [];
    const boldSet = linesResult.boldLineIndices || {};
    const stylesMap = linesResult.lineStyles || {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ls = stylesMap[i];
      const isBold = boldSet[i] || (ls && ls.bold);

      // Handle size changes for remarks
      if (ls) {
        const sizeVal = String(ls.length || '').toLowerCase();
        if (sizeVal === 'large') {
          parts.push(CMD.FONT_DOUBLE);
        } else if (sizeVal === 'medium') {
          parts.push(CMD.FONT_WIDE);
        }
      }

      if (isBold) parts.push(CMD.BOLD_ON);

      parts.push(Buffer.from(line, 'utf8'));
      parts.push(CMD.LF);

      if (isBold) parts.push(CMD.BOLD_OFF);

      // Reset font size if it was changed
      if (ls) {
        const sizeVal = String(ls.length || '').toLowerCase();
        if (sizeVal === 'large' || sizeVal === 'medium') {
          parts.push(CMD.FONT_NORMAL);
        }
      }
    }

    // Feed + cut
    parts.push(CMD.FEED_LINES(3));
    parts.push(CMD.CUT);

    return Buffer.concat(parts);
  }

  /**
   * Graphic mode: render HTML receipt → screenshot → monochrome raster → ESC/POS GS v 0.
   * @param {object} payload - Receipt payload
   * @param {object} config - Printer config (for kitchenMode etc.)
   * @param {object} opts
   * @param {boolean} [opts.kitchenMode=false]
   * @param {number} [opts.maxWidth=576] - Max raster width in dots (576 = 80mm at 203dpi)
   * @returns {Promise<Buffer>}
   */
  static async buildGraphicMode(payload, config = {}, opts = {}) {
    const kitchenMode = opts.kitchenMode || false;
    const maxWidth = opts.maxWidth || 576;

    // Build the HTML receipt
    const html = buildReceiptHtml(payload, { kitchenMode });

    // Render in hidden BrowserWindow
    const win = new BrowserWindow({
      width: maxWidth,
      height: 2000,
      show: false,
      webPreferences: { sandbox: true, offscreen: true }
    });

    try {
      const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
      await new Promise((resolve, reject) => {
        const loadTimeout = setTimeout(() => reject(new Error('EscPosBuilder: page load timed out')), 15000);
        win.once('closed', () => { clearTimeout(loadTimeout); reject(new Error('EscPosBuilder: window closed during load')); });
        win.webContents.once('did-finish-load', () => { clearTimeout(loadTimeout); resolve(); });
        win.webContents.once('did-fail-load', (_e, code, desc) => {
          clearTimeout(loadTimeout);
          reject(new Error(`EscPosBuilder: failed to load HTML (${code}) ${desc}`));
        });
        win.loadURL(url);
      });

      // Wait for images
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
        await Promise.race([waitImages, new Promise((r) => setTimeout(r, 4000))]);
      } catch (_) {}

      // Get actual content height
      const contentHeight = await win.webContents.executeJavaScript(
        'Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)'
      );
      win.setSize(maxWidth, Math.min(contentHeight + 20, 8000));

      // Capture screenshot
      const screenshot = await win.webContents.capturePage();
      if (!screenshot || screenshot.isEmpty()) {
        throw new Error('Screenshot capture returned empty image');
      }

      // Convert to raster bytes
      const rasterBytes = nativeImageToRaster(screenshot, maxWidth);

      // Build final buffer: INIT + raster + feed + cut
      const parts = [
        CMD.INIT,
        rasterBytes,
        CMD.FEED_LINES(3),
        CMD.CUT
      ];

      log.info(`[EscPosBuilder] graphic mode buffer built: ${screenshot.getSize().width}x${screenshot.getSize().height}px`);
      return Buffer.concat(parts);

    } finally {
      if (!win.isDestroyed()) win.close();
    }
  }
}

module.exports = EscPosBuilder;

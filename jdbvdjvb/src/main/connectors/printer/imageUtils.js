/**
 * imageUtils.js
 * Image fetching, inlining, monochrome conversion, and ESC/POS raster generation.
 * Extracted from PrintConnector.js.
 */
const { BrowserWindow, nativeImage } = require('electron');
const http = require('http');
const https = require('https');
const log = require('../../../logger');

/* ---------- Fetch remote image → data URL ---------- */
function fetchToDataUrl(url, depth = 0) {
  return new Promise((resolve) => {
    if (!url || depth > 3) {
      resolve(null);
      return;
    }
    try {
      const isHttps = url.startsWith('https:');
      const client = isHttps ? https : http;
      const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined;
      const req = client.get(
        url,
        { headers: { 'User-Agent': 'Mozilla/5.0 (PrintConnector)' }, timeout: 6000, agent },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const next = new URL(res.headers.location, url).toString();
            fetchToDataUrl(next, depth + 1).then(resolve).catch(() => resolve(null));
            return;
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            try {
              const buf = Buffer.concat(chunks);
              if (!buf.length) return resolve(null);
              const mime = (res.headers['content-type'] || 'image/png').split(';')[0];
              const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
              resolve(dataUrl);
            } catch (_) {
              resolve(null);
            }
          });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.on('error', () => resolve(null));
    } catch (_) {
      resolve(null);
    }
  });
}

/* ---------- Inline logo URLs as data URIs ---------- */
async function inlineLogoInPayload(payload) {
  if (!payload || !Array.isArray(payload.data)) return payload;
  const blocks = [];
  for (const block of payload.data) {
    if (block?.type === 'logo' && block.data?.url && /^https?:\/\//i.test(block.data.url)) {
      const inlined = await fetchToDataUrl(block.data.url);
      blocks.push({
        ...block,
        data: {
          ...block.data,
          url: inlined || block.data.url
        }
      });
    } else {
      blocks.push(block);
    }
  }
  return { ...payload, data: blocks };
}

/* ---------- Monochrome B/W conversion via hidden BrowserWindow ---------- */
async function processImageForBW(url) {
  if (!url) return null;
  log.info('[imageUtils] processImageForBW: starting conversion...');

  const win = new BrowserWindow({
    width: 200, height: 200, show: false,
    webPreferences: { offscreen: true, contextIsolation: false, nodeIntegration: true }
  });

  try {
    const safeUrl = JSON.stringify(url);

    const code = `
      (async () => {
        try {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = ${safeUrl};
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Image load failed'));
            setTimeout(() => reject(new Error('Image load timeout')), 7000);
          });

          const w = img.width;
          const h = img.height;
          if (!w || !h) throw new Error('Invalid image dimensions');

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const data = ctx.getImageData(0, 0, w, h);
          const rgba = data.data;

          for (let i = 0; i < rgba.length; i += 4) {
            const r = rgba[i];
            const g = rgba[i+1];
            const b = rgba[i+2];
            const val = (r + g + b) / 3;
            const newCol = val < 160 ? 0 : 255;
            rgba[i] = newCol;
            rgba[i+1] = newCol;
            rgba[i+2] = newCol;
            rgba[i+3] = 255;
          }
          ctx.putImageData(data, 0, 0);
          return canvas.toDataURL('image/png');
        } catch (e) {
          return null;
        }
      })();
    `;

    const processing = win.webContents.executeJavaScript(code);
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 8000));

    const result = await Promise.race([processing, timeout]);
    log.info('[imageUtils] processImageForBW: result obtained', !!result);
    return result;

  } catch (err) {
    log.error('[imageUtils] Failed to process BW image', err);
    return null;
  } finally {
    if (!win.isDestroyed()) win.close();
  }
}

/* ---------- Image → ESC/POS Raster (GS v 0) ---------- */
async function generateEscPosLogo(url, maxWidth = 576) {
  if (!url) return Buffer.alloc(0);

  try {
    let dataUrl = url;
    if (!url.startsWith('data:')) {
      log.info('[imageUtils] downloading logo for ESC/POS bitmap...');
      dataUrl = await fetchToDataUrl(url);
      if (!dataUrl) {
        log.warn('[imageUtils] logo download failed, skipping logo');
        return Buffer.alloc(0);
      }
    }

    let img = nativeImage.createFromDataURL(dataUrl);
    if (img.isEmpty()) {
      log.warn('[imageUtils] nativeImage is empty, skipping logo');
      return Buffer.alloc(0);
    }

    const origSize = img.getSize();
    if (origSize.width > maxWidth) {
      const newHeight = Math.round((maxWidth / origSize.width) * origSize.height);
      img = img.resize({ width: maxWidth, height: newHeight });
    }

    const { width, height } = img.getSize();
    const bitmap = img.toBitmap(); // raw RGBA pixel data

    // Convert RGBA to 1-bit monochrome
    const bytesPerRow = Math.ceil(width / 8);
    const mono = Buffer.alloc(bytesPerRow * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = bitmap[idx];
        const g = bitmap[idx + 1];
        const b = bitmap[idx + 2];
        const luminosity = (r + g + b) / 3;
        if (luminosity < 180) {
          const byteIdx = y * bytesPerRow + Math.floor(x / 8);
          const bit = 7 - (x % 8);
          mono[byteIdx] |= (1 << bit);
        }
      }
    }

    // GS v 0 m xL xH yL yH d1...dk
    const xL = bytesPerRow % 256;
    const xH = Math.floor(bytesPerRow / 256);
    const yL = height % 256;
    const yH = Math.floor(height / 256);
    const header = Buffer.from([0x1d, 0x76, 0x30, 0, xL, xH, yL, yH]);

    log.info(`[imageUtils] ESC/POS logo generated: ${width}x${height}px`);
    return Buffer.concat([header, mono, Buffer.from('\n')]);
  } catch (err) {
    log.error('[imageUtils] failed to rasterize logo:', err);
    return Buffer.alloc(0);
  }
}

/**
 * Convert a NativeImage to a 1-bit monochrome raster buffer
 * wrapped in the ESC/POS GS v 0 command.
 * Used by EscPosBuilder for graphic mode.
 */
function nativeImageToRaster(img, maxWidth = 576) {
  const origSize = img.getSize();
  if (origSize.width > maxWidth) {
    const newHeight = Math.round((maxWidth / origSize.width) * origSize.height);
    img = img.resize({ width: maxWidth, height: newHeight });
  }

  const { width, height } = img.getSize();
  const bitmap = img.toBitmap();

  const bytesPerRow = Math.ceil(width / 8);
  const mono = Buffer.alloc(bytesPerRow * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = bitmap[idx];
      const g = bitmap[idx + 1];
      const b = bitmap[idx + 2];
      const luminosity = (r + g + b) / 3;
      if (luminosity < 180) {
        const byteIdx = y * bytesPerRow + Math.floor(x / 8);
        const bit = 7 - (x % 8);
        mono[byteIdx] |= (1 << bit);
      }
    }
  }

  const xL = bytesPerRow % 256;
  const xH = Math.floor(bytesPerRow / 256);
  const yL = height % 256;
  const yH = Math.floor(height / 256);
  const header = Buffer.from([0x1d, 0x76, 0x30, 0, xL, xH, yL, yH]);

  return Buffer.concat([header, mono]);
}

module.exports = {
  fetchToDataUrl,
  inlineLogoInPayload,
  processImageForBW,
  generateEscPosLogo,
  nativeImageToRaster
};

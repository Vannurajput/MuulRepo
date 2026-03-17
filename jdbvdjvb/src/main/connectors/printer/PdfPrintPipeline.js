/**
 * PdfPrintPipeline.js
 * Handles PDF → thermal printer pipeline.
 *
 * Two paths:
 *   System printer: Load PDF in BrowserWindow → webContents.print()
 *   Network printer: PDF → screenshot → slice → monochrome raster → ESC/POS
 */
const { BrowserWindow, app } = require('electron');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const log = require('../../../logger');

/* ---------- Debug: save images to pdf-debug folder ---------- */
function getDebugDir() {
  const dir = path.join(app.getPath('userData'), 'pdf-debug');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveDebugImage(nativeImage, label) {
  try {
    const dir = getDebugDir();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(dir, `${ts}_${label}.png`);
    fs.writeFileSync(filePath, nativeImage.toPNG());
    log.info(`[PdfPrintPipeline] debug image saved: ${filePath}`);
  } catch (err) {
    log.warn('[PdfPrintPipeline] failed to save debug image:', err.message);
  }
}
const { nativeImageToRaster } = require('./imageUtils');

/* ---------- ESC/POS constants (same as EscPosBuilder) ---------- */
const INIT = Buffer.from([0x1b, 0x40]);
const FEED_LINES = (n) => Buffer.from([0x1b, 0x64, n]);
const CUT = Buffer.from([0x1d, 0x56, 0x00]);

/* ---------- Download PDF from URL → Buffer ---------- */
function downloadPdf(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('PdfPrintPipeline: no URL provided'));
      return;
    }

    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined;

    const req = client.get(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0 (PrintConnector)' }, timeout: 30000, agent },
      (res) => {
        // Follow redirects (up to 5)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).toString();
          downloadPdf(next).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`PDF download failed: HTTP ${res.statusCode}`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          log.info(`[PdfPrintPipeline] downloaded PDF: ${buffer.length} bytes`);
          resolve(buffer);
        });
        res.on('error', reject);
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('PDF download timed out'));
    });
  });
}

/* ---------- Build HTML page that uses PDF.js to render all pages ---------- */
function buildPdfJsHtml(targetWidth) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; width: ${targetWidth}px; }
  canvas { display: block; }
</style>
</head>
<body>
<div id="pdf-container"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  window.__pdfjsReady = true;

  window.__renderAllPages = async function(base64Data) {
    var raw = atob(base64Data);
    var uint8 = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);

    var pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
    var container = document.getElementById('pdf-container');
    var w = ${targetWidth};

    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var vp = page.getViewport({ scale: 1 });
      var scale = w / vp.width;
      var scaled = page.getViewport({ scale: scale });

      var canvas = document.createElement('canvas');
      canvas.width = scaled.width;
      canvas.height = scaled.height;
      container.appendChild(canvas);

      await page.render({
        canvasContext: canvas.getContext('2d'),
        viewport: scaled
      }).promise;
    }

    return { totalHeight: container.scrollHeight, pageCount: pdf.numPages };
  };
</script>
</body></html>`;
}

/* ---------- Render PDF to NativeImage using PDF.js ---------- */
async function renderPdfToImage(pdfUrl, options = {}) {
  const width = options.width || 576;

  // Convert input to PDF buffer
  let pdfBuffer;
  if (Buffer.isBuffer(pdfUrl)) {
    pdfBuffer = pdfUrl;
  } else if (typeof pdfUrl === 'string' && pdfUrl.startsWith('data:')) {
    const match = pdfUrl.match(/;base64,(.+)/);
    if (match) {
      pdfBuffer = Buffer.from(match[1], 'base64');
    }
  }
  if (!pdfBuffer) {
    throw new Error('PdfPrintPipeline: invalid PDF input');
  }

  // Write temporary HTML file with PDF.js renderer
  const tmpHtmlPath = path.join(app.getPath('temp'), `mobrowser-pdf-render-${Date.now()}.html`);
  fs.writeFileSync(tmpHtmlPath, buildPdfJsHtml(width));

  const win = new BrowserWindow({
    width,
    height: 800,
    show: false,
    useContentSize: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      sandbox: false
    }
  });

  try {
    log.info('[PdfPrintPipeline] loading PDF.js renderer...');
    await win.loadFile(tmpHtmlPath);

    // Wait for PDF.js library to load from CDN
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('PDF.js load timed out')), 20000);
      const check = setInterval(async () => {
        try {
          const ready = await win.webContents.executeJavaScript('!!window.__pdfjsReady');
          if (ready) {
            clearInterval(check);
            clearTimeout(timeout);
            resolve();
          }
        } catch (_) {}
      }, 300);
    });

    log.info('[PdfPrintPipeline] PDF.js loaded, rendering all pages...');

    // Pass PDF data as base64 and render all pages as canvas elements
    const pdfBase64 = pdfBuffer.toString('base64');
    const renderResult = await win.webContents.executeJavaScript(
      `window.__renderAllPages("${pdfBase64}")`
    );

    log.info(`[PdfPrintPipeline] rendered ${renderResult.pageCount} pages, content height: ${renderResult.totalHeight}px`);

    // Resize window to fit all rendered content
    const targetHeight = Math.min(renderResult.totalHeight + 10, 20000);
    win.setContentSize(width, targetHeight);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Capture the full page
    let screenshot = await win.webContents.capturePage();
    const size = screenshot.getSize();
    log.info(`[PdfPrintPipeline] raw PDF screenshot: ${size.width}x${size.height}px`);

    // Save debug image BEFORE auto-crop
    saveDebugImage(screenshot, '1_before_crop');

    // Auto-crop white/blank space from top and bottom
    try {
      const bitmap = screenshot.toBitmap();
      const sz = screenshot.getSize();
      const stride = sz.width * 4;
      const CONTENT_THRESHOLD = 200;

      const rowHasContent = (row) => {
        let darkCount = 0;
        for (let col = 0; col < sz.width; col += 2) {
          const offset = row * stride + col * 4;
          const r = bitmap[offset];
          const g = bitmap[offset + 1];
          const b = bitmap[offset + 2];
          if (r < CONTENT_THRESHOLD && g < CONTENT_THRESHOLD && b < CONTENT_THRESHOLD) {
            darkCount++;
            if (darkCount >= 3) return true;
          }
        }
        return false;
      };

      let topRow = 0;
      for (let row = 0; row < sz.height; row++) {
        if (rowHasContent(row)) { topRow = row; break; }
      }

      let bottomRow = sz.height - 1;
      for (let row = sz.height - 1; row >= topRow; row--) {
        if (rowHasContent(row)) { bottomRow = row; break; }
      }

      const padTop = 5;
      const padBottom = 15;
      const cropY = Math.max(0, topRow - padTop);
      const cropH = Math.min(sz.height - cropY, (bottomRow + padBottom) - cropY);

      if (cropH > 50) {
        screenshot = screenshot.crop({ x: 0, y: cropY, width: sz.width, height: cropH });
        log.info(`[PdfPrintPipeline] auto-cropped: removed ${topRow}px top, ${sz.height - bottomRow}px bottom → ${screenshot.getSize().width}x${screenshot.getSize().height}px`);
      }
    } catch (cropErr) {
      log.warn('[PdfPrintPipeline] auto-crop failed, using uncropped image:', cropErr.message);
    }

    // Save debug image AFTER auto-crop
    saveDebugImage(screenshot, '2_after_crop');

    return screenshot;
  } finally {
    if (!win.isDestroyed()) win.close();
    try { fs.unlinkSync(tmpHtmlPath); } catch (_) {}
  }
}

/* ---------- Slice NativeImage into strips → ESC/POS raster ---------- */
function sliceAndRasterize(img, maxWidth = 576, stripHeight = 256) {
  const size = img.getSize();

  // Resize to maxWidth if needed
  if (size.width > maxWidth) {
    const newHeight = Math.round((maxWidth / size.width) * size.height);
    img = img.resize({ width: maxWidth, height: newHeight });
  }

  const { width, height } = img.getSize();
  log.info(`[PdfPrintPipeline] slicing image ${width}x${height}px into ${stripHeight}px strips`);

  const stripBuffers = [];
  let stripIndex = 0;
  for (let y = 0; y < height; y += stripHeight) {
    const h = Math.min(stripHeight, height - y);
    const strip = img.crop({ x: 0, y, width, height: h });
    stripIndex++;
    saveDebugImage(strip, `strip_${stripIndex}`);
    const raster = nativeImageToRaster(strip, maxWidth);
    stripBuffers.push(raster);
  }

  log.info(`[PdfPrintPipeline] generated ${stripBuffers.length} raster strips`);

  return Buffer.concat([
    INIT,
    ...stripBuffers,
    FEED_LINES(3),
    CUT
  ]);
}

/* ---------- Full pipeline: URL → ESC/POS Buffer ---------- */
async function buildPdfEscPos(pdfUrl, options = {}) {
  const maxWidth = options.maxWidth || 576;
  const stripHeight = options.stripHeight || 256;

  // If already a data URL, pass directly; otherwise download first
  let pdfSource = pdfUrl;
  if (!pdfUrl.startsWith('data:')) {
    pdfSource = await downloadPdf(pdfUrl);
  }

  // Render to image
  const screenshot = await renderPdfToImage(pdfSource, { width: maxWidth });

  // Slice and rasterize
  return sliceAndRasterize(screenshot, maxWidth, stripHeight);
}

/* ---------- System printer path: PDF → render as image → print ---------- */
async function printPdfViaSystem(pdfUrl, deviceName) {
  if (!deviceName) {
    log.error('[PdfPrintPipeline] missing device name');
    return { ok: false, error: 'printer_config_missing' };
  }

  try {
    log.info(`[PdfPrintPipeline] rendering PDF as image for system print: ${pdfUrl}`);

    // If already a data URL, pass directly; otherwise download first
    let pdfSource = pdfUrl;
    if (!pdfUrl.startsWith('data:')) {
      pdfSource = await downloadPdf(pdfUrl);
    }
    const screenshot = await renderPdfToImage(pdfSource, { width: 576 });
    const size = screenshot.getSize();

    // Convert NativeImage to data URL for embedding in HTML
    const pngDataUrl = screenshot.toDataURL();

    // Build simple HTML with the cropped PDF image
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: 80mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { width: 80mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    img { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <img src="${pngDataUrl}" alt="PDF" />
</body>
</html>`;

    log.info(`[PdfPrintPipeline] PDF rendered to image: ${size.width}x${size.height}px, printing via SystemPrintBridge`);

    // Use SystemPrintBridge — same path as regular receipts (no top margin issue)
    const SystemPrintBridge = require('./SystemPrintBridge');
    return await SystemPrintBridge.print(html, deviceName);
  } catch (err) {
    log.error('[PdfPrintPipeline] printPdfViaSystem failed:', err);
    return { ok: false, error: err?.message || 'pdf_system_print_failed' };
  }
}

module.exports = {
  downloadPdf,
  renderPdfToImage,
  sliceAndRasterize,
  buildPdfEscPos,
  printPdfViaSystem
};

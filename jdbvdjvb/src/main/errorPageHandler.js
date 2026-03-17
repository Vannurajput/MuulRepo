/**
 * errorPageHandler.js
 * Catches page load failures on a WebContentsView and displays a
 * Chrome-style error page instead of a blank white screen.
 *
 * Usage (in tabManager.js):
 *   const { attachErrorPage } = require('./errorPageHandler');
 *   attachErrorPage(view.webContents);
 */
const path = require('path');
const { pathToFileURL } = require('url');

// Resolve the error page path once at module load.
const ERROR_PAGE = pathToFileURL(
  path.join(__dirname, '../renderer/error/index.html')
).href;

// Error codes that should be silently ignored (e.g. cancelled by user).
const IGNORED_CODES = new Set([
  -3,   // ABORTED — navigation cancelled (user clicked another link quickly)
  0     // No error
]);

/**
 * Attach a did-fail-load listener that shows the custom error page.
 * @param {Electron.WebContents} webContents
 */
const attachErrorPage = (webContents) => {
  if (!webContents || webContents.isDestroyed()) return;

  webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    // Only handle main-frame failures (ignore sub-resource errors like images/css).
    if (!isMainFrame) return;

    // Skip silently-cancelled navigations.
    if (IGNORED_CODES.has(errorCode)) return;

    // Don't show error page for our own error page (prevent infinite loop).
    if (validatedURL && validatedURL.includes('/renderer/error/index.html')) return;

    // Build the error page URL with query parameters.
    const errorPageUrl = `${ERROR_PAGE}?code=${encodeURIComponent(errorCode)}&url=${encodeURIComponent(validatedURL || '')}&desc=${encodeURIComponent(errorDescription || '')}`;

    try {
      if (!webContents.isDestroyed()) {
        webContents.loadURL(errorPageUrl);
      }
    } catch (_) {
      // best effort — webContents may have been destroyed between the check and the call
    }
  });
};

module.exports = { attachErrorPage };

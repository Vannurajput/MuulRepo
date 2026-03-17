/**
 * userAgentFix.js
 *
 * Cleans the "Electron" and app-name tokens from the User-Agent header for
 * ALL outgoing requests by default, so every website sees a standard Chrome UA.
 *
 * Exception: Google domains keep the original UA (with "Electron") because
 * Google checks that the UA matches sec-ch-ua and navigator.userAgentData.
 * A mismatch causes Google to block sign-in with "not secure".
 *
 * Call `applyCleanUserAgent()` once after app.whenReady().
 */
const { session, app } = require('electron');

/** Escape special regex characters in a string. */
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Google domains that require the original UA with "Electron" for sign-in.
 * These check UA vs Client Hints consistency — any mismatch blocks sign-in.
 */
const KEEP_ORIGINAL_DOMAINS = [
  'google.com',
  'googleapis.com',
  'gstatic.com',
  'googleusercontent.com'
];

/** Check if a URL belongs to a Google domain that needs the original UA. */
const needsOriginalUA = (url) => {
  try {
    const hostname = new URL(url).hostname;
    return KEEP_ORIGINAL_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (_) {
    return false;
  }
};

const applyCleanUserAgent = () => {
  const ses = session.defaultSession;
  if (!ses) return;

  const raw = ses.getUserAgent();
  const appName = app.getName() || '';

  // Build a cleaned UA without Electron/AppName tokens.
  const cleanedUA = raw
    .replace(/\s*Electron\/[\w.-]+/gi, '')
    .replace(new RegExp(`\\s*${escapeRegExp(appName)}\\/[\\w.-]+`, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Clean UA for all sites by default; keep original only for Google.
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    if (needsOriginalUA(details.url)) {
      callback({ requestHeaders: details.requestHeaders });
    } else {
      const headers = { ...details.requestHeaders };
      headers['User-Agent'] = cleanedUA;
      callback({ requestHeaders: headers });
    }
  });
};

module.exports = { applyCleanUserAgent };

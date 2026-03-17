/**
 * snapManager.js
 * Handles Windows 11 Snap Layout integration for frameless windows.
 * - Sends window size category to renderer on every resize
 * - Broadcasts maximized padding flag so the renderer can compensate
 *   for the ~8 px invisible border Windows adds to maximized frameless windows
 */

const SIZE_CLASSES = {
  COMPACT: 'compact',   // quarter screen / very narrow  (<640 px)
  NARROW: 'narrow',     // half screen                   (640–1024 px)
  MEDIUM: 'medium',     // two-thirds / large half       (1024–1280 px)
  FULL: 'full'          // full / maximized               (>1280 px)
};

function classifyWidth(width) {
  if (width < 640) return SIZE_CLASSES.COMPACT;
  if (width < 1024) return SIZE_CLASSES.NARROW;
  if (width < 1280) return SIZE_CLASSES.MEDIUM;
  return SIZE_CLASSES.FULL;
}

/**
 * Initialise snap helpers for the given BrowserWindow.
 * Call once after `mainWindow` is created.
 *
 * @param {import('electron').BrowserWindow} win
 */
function init(win) {
  if (!win || win.isDestroyed()) return;

  let lastSizeClass = '';
  let lastMaximized = null;

  const broadcast = () => {
    if (win.isDestroyed()) return;

    const [width] = win.getContentSize();
    const sizeClass = classifyWidth(width);
    const isMaximized = win.isMaximized();

    // Only send when something actually changed
    if (sizeClass === lastSizeClass && isMaximized === lastMaximized) return;
    lastSizeClass = sizeClass;
    lastMaximized = isMaximized;

    win.webContents.send('snap:state', { sizeClass, isMaximized, width });
  };

  win.on('resize', broadcast);
  win.on('maximize', broadcast);
  win.on('unmaximize', broadcast);
  win.once('ready-to-show', broadcast);

  // Send initial state once the renderer page has loaded
  win.webContents.once('did-finish-load', broadcast);
}

module.exports = { init };

const { BrowserWindow, screen } = require('electron');
const path = require('path');

function getWindowSize() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  return {
    width: Math.round(Math.min(520, Math.max(380, sw * 0.35))),
    height: Math.round(Math.min(700, Math.max(400, sh * 0.70)))
  };
}

function createCredentialFormController(getMainWindow) {
  let dbFormWindow = null;

  const ensureWindow = () => {
    if (dbFormWindow && !dbFormWindow.isDestroyed()) {
      return dbFormWindow;
    }

    const parent = getMainWindow?.();
    const size = getWindowSize();
    dbFormWindow = new BrowserWindow({
      width: size.width,
      height: size.height,
      frame: false,
      resizable: false,
      show: false,
      transparent: true,
      backgroundColor: '#00000000',
      parent: parent || undefined,
      skipTaskbar: true,
      hasShadow: true,
      webPreferences: {
        preload: path.join(__dirname, '../../preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    dbFormWindow.setMenuBarVisibility(false);
    dbFormWindow.loadFile(path.join(__dirname, '../../renderer/credentials/index.html'));
    dbFormWindow.on('blur', () => {
      if (dbFormWindow && dbFormWindow.isVisible()) {
        dbFormWindow.hide();
      }
    });
    dbFormWindow.on('closed', () => {
      dbFormWindow = null;
    });

    return dbFormWindow;
  };

  const applyBounds = (target, bounds, mainWindow) => {
    const size = getWindowSize();
    const mainBounds = mainWindow.getContentBounds();
    const fallbackX = mainBounds.x + mainBounds.width - size.width - 24;
    const fallbackY = mainBounds.y + 40;
    const { x = fallbackX, y = fallbackY } = bounds || {};

    const desiredX = (typeof x === 'number' ? x : fallbackX) - size.width - 12;
    const desiredY = typeof y === 'number' ? y : fallbackY;

    target.setBounds({
      width: size.width,
      height: size.height,
      x: Math.round(desiredX),
      y: Math.round(desiredY)
    });
  };

  const showWindow = (bounds = {}) => {
    const target = ensureWindow();
    const mainWindow = getMainWindow?.();
    if (!target || !mainWindow) {
      return;
    }

    applyBounds(target, bounds, mainWindow);
    target.show();
    target.focus();
  };

  const toggleWindow = (bounds = {}) => {
    const target = ensureWindow();
    const mainWindow = getMainWindow?.();
    if (!target || !mainWindow) {
      return;
    }

    if (target.isVisible()) {
      target.hide();
      return;
    }

    applyBounds(target, bounds, mainWindow);
    target.show();
    target.focus();
  };

  const closeWindow = () => {
    if (dbFormWindow && !dbFormWindow.isDestroyed()) {
      dbFormWindow.hide();
    }
  };

  const destroy = () => {
    if (dbFormWindow && !dbFormWindow.isDestroyed()) {
      dbFormWindow.close();
    }
    dbFormWindow = null;
  };

  return {
    toggleWindow,
    openWindow: showWindow,
    closeWindow,
    destroy,
    getWindow: () => dbFormWindow
  };
}

module.exports = {
  createCredentialFormController
};

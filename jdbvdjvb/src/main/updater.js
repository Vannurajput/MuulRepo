const { BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('../logger');

const status = (_mainWindow, payload) => {
  try {
    // Send update status to ALL open windows (main window + settings popup + any other popups)
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('update:status', payload);
      }
    });
  } catch (err) {
    log.warn('[Updater] failed to send status', err);
  }
};

const initUpdater = (mainWindow) => {
  if (!mainWindow) return;

  autoUpdater.logger = log;

  // ✅ keep downloading automatically when update found
  autoUpdater.autoDownload = true;

  // ✅ IMPORTANT: do NOT auto-install when app quits (so user must click "Restart to install")
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => status(mainWindow, { state: 'checking' }));
  autoUpdater.on('update-available', (info) => status(mainWindow, { state: 'available', info }));
  autoUpdater.on('update-not-available', () => status(mainWindow, { state: 'not-available' }));
  autoUpdater.on('download-progress', (progress) => {
    status(mainWindow, {
      state: 'downloading',
      percent: Math.round(progress.percent || 0),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
  });
  autoUpdater.on('update-downloaded', (info) => status(mainWindow, { state: 'downloaded', info }));
  autoUpdater.on('error', (error) =>
    status(mainWindow, { state: 'error', message: error?.message || String(error) })
  );

  return autoUpdater;
};

module.exports = { initUpdater, autoUpdater };


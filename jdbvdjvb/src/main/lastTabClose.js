/**
 * lastTabClose.js
 * Closes the application window when the last tab is closed.
 */

function handleLastTabClose(mainWindow) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
}

module.exports = { handleLastTabClose };

const { ask } = require('./chatService');

const DRAWER_WIDTH = 360;
const log = (...args) => console.log('[ChatIPC]', ...args);

function registerChatIpc({ ipcMain, getMainWindow, getTabManager }) {
  let open = false;

  const emitState = () => {
    const win = getMainWindow?.();
    if (win && !win.isDestroyed()) {
      win.webContents.send('chat:state', { open });
    }
  };

  const applyInset = () => {
    const tm = getTabManager?.();
    tm?.updateRightInset?.(open ? DRAWER_WIDTH : 0);
  };

  ipcMain.handle('chat:toggle', async () => {
    open = !open;
    log('toggle', open);
    applyInset();
    emitState();
    return { open };
  });

  ipcMain.handle('chat:ask', async (_event, payload = {}) => {
    const prompt = payload?.prompt || '';
    const history = payload?.history || [];
    log('ask', { prompt, historyLength: Array.isArray(history) ? history.length : 0 });
    try {
      const timeoutMs = 60000;
      const reply = await Promise.race([
        ask({ prompt, history }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Chat request timed out')), timeoutMs))
      ]);
      log('reply', reply?.slice(0, 120) || '<empty>');
      return { reply };
    } catch (err) {
      log('error', err?.message || err);
      return { reply: 'The chat service is unavailable right now.' };
    }
  });
}

module.exports = { registerChatIpc };

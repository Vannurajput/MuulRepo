/**
 * preload.js
 * Safe bridge exposing whitelisted IPC helpers to renderer code and blocking unwanted access.
 */
const { contextBridge, ipcRenderer } = require('electron');

// [INLINED CHAT BRIDGE]
contextBridge.exposeInMainWorld('chatBridge', {
  toggle: async () => ipcRenderer.invoke('chat:toggle'),
  ask: async (prompt, history = []) => ipcRenderer.invoke('chat:ask', { prompt, history }),
  onState: (cb) => {
    const handler = (_e, state) => typeof cb === 'function' && cb(state);
    ipcRenderer.on('chat:state', handler);
    return () => ipcRenderer.removeListener('chat:state', handler);
  }
});

contextBridge.exposeInMainWorld('browserBridge', {
  // Tab CRUD helpers
  createTab: () => ipcRenderer.invoke('tabs:new'),
  activateTab: (tabId) => ipcRenderer.invoke('tabs:activate', tabId),
  closeTab: (tabId) => ipcRenderer.invoke('tabs:close', tabId),
  moveTab: (tabId, beforeTabId) => ipcRenderer.invoke('tabs:move', { tabId, beforeTabId }),
  navigate: (input) => ipcRenderer.invoke('tabs:navigate', input),
  reload: () => ipcRenderer.invoke('tabs:reload'),
  goBack: () => ipcRenderer.invoke('tabs:back'),
  goForward: () => ipcRenderer.invoke('tabs:forward'),
  updateTopOffset: (height) => ipcRenderer.invoke('chrome:update-offset', height),
  showSuggestionsPopup: (bounds, payload) => ipcRenderer.invoke('suggestions:toggle-popup', bounds, payload),
  updateSuggestionsPopup: (payload) => ipcRenderer.invoke('suggestions:update', payload),
  closeSuggestionsPopup: () => ipcRenderer.invoke('suggestions:hide'),
  showSecurityPopover: (bounds, payload) => ipcRenderer.invoke('security:show', bounds, payload),
  updateSecurityPopover: (payload) => ipcRenderer.invoke('security:update', payload),
  closeSecurityPopover: () => ipcRenderer.invoke('security:hide'),
  onSecurityPopoverClosed: (callback) => {
    const handler = () => {
      if (typeof callback === 'function') {
        callback();
      }
    };
    ipcRenderer.on('security:closed', handler);
    return () => ipcRenderer.removeListener('security:closed', handler);
  },

  // [ADDED - TAB ACTIONS] context-menu operations
  pinTab: (tabId) => ipcRenderer.invoke('tabs:pin', tabId),
  closeOtherTabs: (tabId) => ipcRenderer.invoke('tabs:close-others', tabId),
  closeTabsToRight: (tabId) => ipcRenderer.invoke('tabs:close-right', tabId),
  reloadTab: (tabId) => ipcRenderer.invoke('tabs:reload-tab', tabId),
  duplicateTab: (tabId) => ipcRenderer.invoke('tabs:duplicate', tabId),
  moveTabToWindow: (tabId) => ipcRenderer.invoke('tabs:move-to-window', tabId),

  // [ADDED ✨] direct pin state + quit app
  setTabPinned: (tabId, pinned) => ipcRenderer.invoke('tabs:setPinned', { tabId, pinned }),
  quitApp: () => ipcRenderer.invoke('app:quit'),

  // [ADDED - TABMENU] open/close the overlay popup from the main renderer
  toggleTabMenuPopup: (bounds, payload) => ipcRenderer.invoke('tabmenu:toggle-popup', bounds, payload),
  closeTabMenuPopup: () => ipcRenderer.invoke('tabmenu:close-popup'),

  // History popup helpers
  getHistory: () => ipcRenderer.invoke('history:get'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  // Bookmark helpers
  getBookmarks: () => ipcRenderer.invoke('bookmarks:get'),
  toggleBookmark: (entry) => ipcRenderer.invoke('bookmarks:toggle', entry),
  saveBookmark: (entry) => ipcRenderer.invoke('bookmarks:save', entry),
  removeBookmark: (entry) => ipcRenderer.invoke('bookmarks:remove', entry),
  clearBookmarks: () => ipcRenderer.invoke('bookmarks:clear'),
  toggleBookmarkQuickPopup: (bounds, context) => ipcRenderer.invoke('bookmarks:toggle-quick', bounds, context),
  closeBookmarkQuickPopup: () => ipcRenderer.invoke('bookmarks:close-quick'),
  updateBookmarkQuickContext: (context) => ipcRenderer.invoke('bookmarks:update-quick-context', context),
  openGithubLoginTab: () => ipcRenderer.invoke('github:open-login-tab'),
  // Git integration
  toggleGitPopup: (bounds) => ipcRenderer.invoke('git:toggle-popup', bounds),
  closeGitPopup: () => ipcRenderer.invoke('git:close-popup'),
  toggleSettingsPopup: (bounds) => ipcRenderer.invoke('settings:toggle-popup', bounds),
  closeSettingsPopup: () => ipcRenderer.invoke('settings:close-popup'),
  resizeSettingsPopup: (height) => ipcRenderer.invoke('settings:resize', height),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  logMessage: (msg) => ipcRenderer.invoke('log:message', msg),
  onUpdateStatus: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('update:status', handler);
    return () => ipcRenderer.removeListener('update:status', handler);
  },
  openCredentialManager: (bounds) => ipcRenderer.invoke('credentials:toggle-popup', bounds),
  closeCredentialManager: () => ipcRenderer.invoke('credentials:close-popup'),
  openCredentialForm: (bounds) => ipcRenderer.invoke('credentials:open-form', bounds),
  getAddressSuggestions: (query) => ipcRenderer.invoke('address:suggestions', query),
  githubGetConfig: () => ipcRenderer.invoke('github:get-config'),
  githubSaveConfig: (config) => ipcRenderer.invoke('github:save-config', config),
  githubSignOut: () => ipcRenderer.invoke('github:sign-out'),
  githubPush: (payload) => ipcRenderer.invoke('github:push', payload),
  githubPull: () => ipcRenderer.invoke('github:pull'),
  githubLog: (entry) => ipcRenderer.invoke('github:log-message', entry),
  onHandshakeStatus: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') {
        callback(payload);
      }
    };
    ipcRenderer.on('codex-handshake-status', handler);
    return () => ipcRenderer.removeListener('codex-handshake-status', handler);
  },
  getCredentialEntry: (type, id) => ipcRenderer.invoke('credentials:entry:get', { type, id }),
  // Window chrome proxies
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleDevTools: () => ipcRenderer.invoke('window:toggle-devtools'),
  openDevTools: () => ipcRenderer.invoke('window:open-devtools'),
  openRendererDevTools: () => ipcRenderer.invoke('window:open-renderer-devtools'),
  openPopupDevTools: () => ipcRenderer.invoke('windows:open-popup-devtools'),
  detachTab: (tabId) => ipcRenderer.invoke('tabs:detach', tabId),
  printActive: () => ipcRenderer.invoke('tabs:print'),
  zoomBridge: {
    get: () => ipcRenderer.invoke('tabs:get-zoom'),
    set: (factor) => ipcRenderer.invoke('tabs:set-zoom', factor),
    in: () => ipcRenderer.invoke('tabs:zoom-in'),
    out: () => ipcRenderer.invoke('tabs:zoom-out'),
    reset: () => ipcRenderer.invoke('tabs:zoom-reset')
  },
  reopenLastClosed: () => ipcRenderer.invoke('tabs:reopen-last'),
  cycleTab: (delta) => ipcRenderer.invoke('tabs:cycle', delta),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),

  // ✨ [ADDED] open a brand-new main application window
  newWindow: () => ipcRenderer.invoke('window:new'),

  // ✨ [ADDED Default Browser] expose "Set as default browser"
  setDefaultBrowser: () => ipcRenderer.invoke('app:set-default-browser'),
  setThemeMode: (mode) => ipcRenderer.invoke('theme:set-mode', mode),
  updateTitleBarSkin: (skin) => ipcRenderer.invoke('titlebar:update-skin', skin),

  /* ===================== [ADDED ✨ DOWNLOADS] =====================
     Bridge methods for the Downloads feature (mini popup + history).
  ---------------------------------------------------------------- */
  getDownloads: () => ipcRenderer.invoke('downloads:get'),
  toggleDownloadsPopup: (bounds) => ipcRenderer.invoke('downloads:toggle-popup', bounds),
  toggleProfilePopup: (bounds) => ipcRenderer.invoke('profile:toggle-popup', bounds),
  hideProfilePopup: () => ipcRenderer.invoke('profile:hide'),

  // Google Profile APIs
  googleGetProfile: () => ipcRenderer.invoke('google:get-profile'),
  googleSignOut: () => ipcRenderer.invoke('google:sign-out'),
  onGoogleProfileUpdate: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('google:profile-update', handler);
    return () => ipcRenderer.removeListener('google:profile-update', handler);
  },

  clearDownloads: () => ipcRenderer.invoke('downloads:clear'),
  openDownloadedItem: (id) => ipcRenderer.invoke('downloads:open-file', id),
  showDownloadedItemInFolder: (id) => ipcRenderer.invoke('downloads:show-in-folder', id),
  cancelDownload: (id) => ipcRenderer.invoke('downloads:cancel', id),
  downloadsOpenHistory: () => ipcRenderer.invoke('downloads:open-history-tab'),

  onDownloadsUpdate: (callback) => {
    const handler = (_e, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('downloads:update', handler);
    return () => ipcRenderer.removeListener('downloads:update', handler);
  },
  /* =================== [/ADDED ✨ DOWNLOADS] ===================== */

  // Theme controls
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setThemeColor: (color) => ipcRenderer.invoke('theme:set', color),
  onThemeUpdate: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') {
        callback(payload);
      }
    };
    ipcRenderer.on('theme:update', handler);
    return () => ipcRenderer.removeListener('theme:update', handler);
  },

  // Subscriptions for renderer state updates
  onTabState: (callback) => {
    const handler = (_, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('tabs:state', handler);
    return () => ipcRenderer.removeListener('tabs:state', handler);
  },
  onHistoryUpdate: (callback) => {
    const handler = (_, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('history:update', handler);
    return () => ipcRenderer.removeListener('history:update', handler);
  },
  onBookmarksUpdate: (callback) => {
    const handler = (_, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('bookmarks:update', handler);
    return () => ipcRenderer.removeListener('bookmarks:update', handler);
  },
  onBookmarkQuickContext: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') {
        callback(payload);
      }
    };
    ipcRenderer.on('bookmark-quick:context', handler);
    return () => ipcRenderer.removeListener('bookmark-quick:context', handler);
  },
  onAppFullscreenToggle: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') {
        callback(payload);
      }
    };
    ipcRenderer.on('window:fullscreen-toggle', handler);
    return () => ipcRenderer.removeListener('window:fullscreen-toggle', handler);
  },
  onWindowState: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') {
        callback(payload || {});
      }
    };
    ipcRenderer.on('window:state', handler);
    return () => ipcRenderer.removeListener('window:state', handler);
  },
  onSnapState: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') callback(payload || {});
    };
    ipcRenderer.on('snap:state', handler);
    return () => ipcRenderer.removeListener('snap:state', handler);
  },
  onZoomFactor: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') {
        callback(payload);
      }
    };
    ipcRenderer.on('tabs:zoom-factor', handler);
    return () => ipcRenderer.removeListener('tabs:zoom-factor', handler);
  },
  onShortcutFocusAddress: (callback) => {
    const handler = (_event, payload = {}) => {
      if (typeof callback === 'function') {
        callback(payload);
      }
    };
    ipcRenderer.on('shortcuts:focus-address', handler);
    return () => ipcRenderer.removeListener('shortcuts:focus-address', handler);
  },
  onShortcutBookmark: (callback) => {
    const handler = () => {
      if (typeof callback === 'function') callback();
    };
    ipcRenderer.on('shortcuts:bookmark-current', handler);
    return () => ipcRenderer.removeListener('shortcuts:bookmark-current', handler);
  },
  onShortcutDownloads: (callback) => {
    const handler = () => {
      if (typeof callback === 'function') callback();
    };
    ipcRenderer.on('shortcuts:open-downloads', handler);
    return () => ipcRenderer.removeListener('shortcuts:open-downloads', handler);
  },
  onShortcutHistory: (callback) => {
    const handler = () => {
      if (typeof callback === 'function') callback();
    };
    ipcRenderer.on('shortcuts:open-history', handler);
    return () => ipcRenderer.removeListener('shortcuts:open-history', handler);
  },
  onShortcutFind: (callback) => {
    const handler = () => {
      if (typeof callback === 'function') callback();
    };
    ipcRenderer.on('shortcuts:find-in-page', handler);
    return () => ipcRenderer.removeListener('shortcuts:find-in-page', handler);
  },
  findInPage: (text) => ipcRenderer.invoke('tabs:find', text),
  stopFindInPage: () => ipcRenderer.invoke('tabs:stop-find'),

  // Scheduler service bridge
  listSchedulerJobs: () => ipcRenderer.invoke('scheduler:list'),
  saveSchedulerJob: (job) => ipcRenderer.invoke('scheduler:save', job),
  deleteSchedulerJob: (jobId) => ipcRenderer.invoke('scheduler:delete', jobId),
  runSchedulerJobNow: (jobId) => ipcRenderer.invoke('scheduler:run-now', jobId),
  getSchedulerLogs: (limit) => ipcRenderer.invoke('scheduler:logs', limit),
  getSchedulerStatus: () => ipcRenderer.invoke('scheduler:status')
});

contextBridge.exposeInMainWorld('printingBridge', {
  onShowReceipt: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === 'function') {
        callback(payload);
      }
    };
    ipcRenderer.on('print:show-receipt', handler);
    return () => ipcRenderer.removeListener('print:show-receipt', handler);
  }
});

contextBridge.exposeInMainWorld('credentialBridge', {
  load: () => ipcRenderer.invoke('credentials:get'),
  save: (payload) => ipcRenderer.invoke('credentials:save', payload),
  test: (payload) => ipcRenderer.invoke('credentials:test', payload),
  close: () => ipcRenderer.invoke('credentials:close-form'),
  closeManager: () => ipcRenderer.invoke('credentials:close-popup'),
  list: () => ipcRenderer.invoke('credentials:list'),
  getEntry: (type, id) => ipcRenderer.invoke('credentials:entry:get', { type, id }),
  deleteEntry: (type, id) => ipcRenderer.invoke('credentials:entry:delete', { type, id }),
  onManagerRefresh: (callback) => {
    const handler = () => {
      if (typeof callback === 'function') callback();
    };
    ipcRenderer.on('credential-manager:refresh', handler);
    return () => ipcRenderer.removeListener('credential-manager:refresh', handler);
  },
  githubReset: () => ipcRenderer.invoke('github:sign-out'),
  saveOtherEntry: (payload) => ipcRenderer.invoke('credentials:other:save', payload),
  savePrinterEntry: (payload) => ipcRenderer.invoke('credentials:printer:save', payload),
  listPrinterEntries: () => ipcRenderer.invoke('credentials:printer:list'),
  testPrinterConnection: (payload) => ipcRenderer.invoke('credentials:printer:test', payload),
  listUsbPrinters: () => ipcRenderer.invoke('credentials:printer:usb-devices')
});

contextBridge.exposeInMainWorld('tabMenuBridge', {
  onOpen: (callback) => {
    const handler = (_, payload) => {
      if (typeof callback === 'function') callback(payload);
    };
    ipcRenderer.on('tabmenu:open', handler);
    return () => ipcRenderer.removeListener('tabmenu:open', handler);
  },
  close: () => ipcRenderer.invoke('tabmenu:close-popup')
});

contextBridge.exposeInMainWorld('externalBridge', {
  sendMessage: (message) => ipcRenderer.invoke('external:message', message)
});

window.addEventListener('message', (event) => {
  const msg = event && event.data;
  if (!msg || msg.__from !== 'downloads-ui') return;
  if (msg.type === 'downloads:show-in-folder' && msg.id != null) {
    ipcRenderer.invoke('downloads:show-in-folder', msg.id).catch(() => { });
  }
});

window.addEventListener('message', (event) => {
  const msg = event && event.data;
  if (!msg || msg.__from !== 'git-tab' || !msg.method) return;

  const respond = (payload) => {
    try {
      event.source?.postMessage({ __from: 'git-shell', id: msg.id, ...payload }, '*');
    } catch (_) { }
  };

  const allowedMethods = ['githubGetConfig', 'githubSaveConfig', 'githubSignOut', 'githubLog', 'getCredentialEntry'];
  if (!allowedMethods.includes(msg.method)) {
    respond({ error: `Blocked git bridge method: ${msg.method}` });
    return;
  }
  const bridgeFn = window.browserBridge?.[msg.method];
  if (typeof bridgeFn !== 'function') {
    respond({ error: `Unknown git bridge method: ${msg.method}` });
    return;
  }

  Promise.resolve(bridgeFn(msg.payload))
    .then((result) => respond({ result }))
    .catch((error) => respond({ error: error?.message || String(error) }));
});

/**
 * main.js
 * Boots the Electron app, manages BrowserViews, popups, and IPC bridges.
 * Acts as the coordinator for tabs, window chrome, auxiliary popups, and Git actions.
 */
const { app, BrowserWindow, ipcMain, nativeTheme, Menu, shell, session, globalShortcut, clipboard } = require('electron');

const path = require('path');
const { pathToFileURL } = require('url'); // for file:// conversion
require('./googleProfileService');
const { DEFAULT_HOME } = require('./constants');
const TabManager = require('./tabManager');
const historyStore = require('./historyStore');
const bookmarkStore = require('./bookmarkStore');
const githubManager = require('./githubManager');
const credentialStore = require('./credentialStore');
const credentialRegistry = require('./credentialRegistry');
const licenseKeyStore = require('./licenseKeyStore');
const { registerPrinterHandlers } = require('./printerController');
const { handleExternalMessage } = require('./messageHandler');
const { createBookmarkQuickController } = require('./windows/bookmarkQuickWindow');
const { createGitController } = require('./windows/gitWindow');
const { createSettingsController } = require('./windows/settingsWindow');
const { createDownloadsController } = require('./windows/downloadsManager');
const { createCredentialFormController } = require('./windows/credentialFormWindow');
const { createCredentialManagerController } = require('./windows/credentialWindow');
const { createSuggestionsWindowController } = require('./windows/suggestionsWindow');
const { createSecurityPopoverController } = require('./windows/securityPopoverWindow');
const { createProfileController } = require('./windows/profileManager');
const { registerShortcutManager } = require('./shortcuts');
const { registerMediaPermissionHandler } = require('./permissions/mediaPermissions');
const { initUpdater, autoUpdater } = require('./updater');
const { applyCleanUserAgent } = require('./userAgentFix');
const registerSchedulerIpc = require('./ipc/scheduler');
const scheduler = require('./scheduler');
// Expose app version
const { app: electronApp } = require('electron');
// use shared logger (electron-log wrapper)
const log = require('../logger');
let customDialogWindow = null;

// give other modules access to downloadsController
const { setDownloadsController } = require('./downloadsRegistry');

// small popup controller
const tabMenuPopup = require('./tabMenuWindow');
const snapManager = require('./snapManager');
const { DEFAULT_THEME, readThemeFile, writeThemeFile } = require('./themeStore');
const keytar = require('keytar');

const GITHUB_LOGIN_URL = 'https://github.com/login';
const GITHUB_LOGOUT_PATHS = new Set(['/logout', '/logout/', '/session/logout', '/sessions/logout']);
const GITHUB_TOKEN_SERVICE = 'CodexBrowser-GitHub';
const GITHUB_TOKEN_ACCOUNT = 'oauth-token';

const INITIAL_URL_FLAG = '--initial-url=';
const parseInitialUrlArg = () => {
  const raw = process.argv.find((arg) => arg.startsWith(INITIAL_URL_FLAG));
  if (!raw) {
    return DEFAULT_HOME;
  }
  try {
    return decodeURIComponent(raw.slice(INITIAL_URL_FLAG.length));
  } catch {
    return DEFAULT_HOME;
  }
};

const launchNewInstance = (initialUrl) => {
  createWindow(initialUrl || DEFAULT_HOME);
};

/* =========================
   Deep-link normalization
   ========================= */
// Accepts raw argv items (may include quotes or wrappers) and returns http(s) URL if present.
const normalizeDeepLink = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();

  // strip wrapping quotes some shells add
  s = s.replace(/^"+|"+$/g, '');

  // unwrap microsoft-edge: or url: wrappers used by some apps
  const edgePrefix = /^microsoft-edge:/i;
  if (edgePrefix.test(s)) s = s.replace(edgePrefix, '');
  s = s.replace(/^url:/i, '');

  // only accept http(s)
  if (/^https?:\/\//i.test(s)) return s;
  return null;
};

// Extract a deep-link target from argv (http/https preferred; otherwise local .htm/.html -> file://)
const extractUrlFromArgs = (argv = []) => {
  for (const rawArg of argv) {
    if (!rawArg) continue;

    // 1) Try to normalize to http/https first (handles microsoft-edge:, quotes, etc.)
    const httpUrl = normalizeDeepLink(rawArg);
    if (httpUrl) return httpUrl;

    // 2) Fall back to local HTML files (convert to file://)
    const arg = String(rawArg).trim().replace(/^"+|"+$/g, '');
    if (arg.startsWith('--')) continue; // ignore switches

    if (/\.(?:html?)$/i.test(arg)) {
      try {
        // Windows absolute path or UNC
        if (/^[a-zA-Z]:\\|^\\\\/.test(arg)) {
          return pathToFileURL(arg).toString();
        }
      } catch {
        // ignore malformed path
      }
    }
  }
  return null;
};

let mainWindow;
let tabManager;
let themeState = { ...DEFAULT_THEME };
let githubTabId = null;
const githubTabCleanups = new Map();
let githubLogoutInProgress = false;
let pendingDeepLinks = [];
let updaterInitialized = false;

/* ====== Multi-window registry ====== */
const windowRegistry = new Map(); // winId -> { win, tabManager }

/** Look up the correct { win, tabManager } for an IPC event sender. */
const getContextForEvent = (event) => {
  const senderWin = BrowserWindow.fromWebContents(event.sender);
  if (senderWin) {
    const ctx = windowRegistry.get(senderWin.id);
    if (ctx) return ctx;
  }
  // fallback to primary window
  return { win: mainWindow, tabManager };
};

const sendWindowState = (win) => {
  const target = win || mainWindow;
  if (target && !target.isDestroyed()) {
    target.webContents.send('window:state', {
      isMaximized: target.isMaximized(),
      isFullScreen: target.isFullScreen?.()
    });
  }
};

// Allow multiple windows/processes (for the "New Window" action) by not enforcing single-instance lock.

const getMainWindow = () => mainWindow;
const getTabManager = () => tabManager;
const emitHandshakeStatus = (payload = {}) => {
  for (const ctx of windowRegistry.values()) {
    if (ctx.win && !ctx.win.isDestroyed()) {
      ctx.win.webContents.send('codex-handshake-status', payload);
    }
  }
};
const bookmarkQuickController = createBookmarkQuickController(getMainWindow);
const gitController = createGitController(getMainWindow);
const settingsController = createSettingsController(getMainWindow);
const credentialFormController = createCredentialFormController(getMainWindow);
const credentialManagerController = createCredentialManagerController(getMainWindow);
const downloadsController = createDownloadsController({
  getMainWindow,
  getTabManager,
  ipcMain,
  log
});
const suggestionsController = createSuggestionsWindowController(getMainWindow);
const securityPopoverController = createSecurityPopoverController(getMainWindow);
const profileController = createProfileController({
  getMainWindow,
  ipcMain,
  log
});

// let other modules record manual downloads
setDownloadsController(downloadsController);

downloadsController.registerIpcHandlers();
profileController.registerIpcHandlers();
const { registerChatIpc } = require('./chatIpc');
const { resolveFetch } = require('./fetchHelper');
registerChatIpc({
  ipcMain,
  getMainWindow,
  getTabManager
});

// Lightweight placeholder: remote suggestions disabled until a provider is configured.
const fetchRemoteSuggestions = async () => [];

const collectTabWebContents = () => {
  const contents = [];
  for (const ctx of windowRegistry.values()) {
    if (ctx.win && !ctx.win.isDestroyed()) {
      contents.push(ctx.win.webContents);
    }
    if (ctx.tabManager?.tabs instanceof Map) {
      for (const tab of ctx.tabManager.tabs.values()) {
        const viewContents = tab?.view?.webContents;
        if (viewContents && !viewContents.isDestroyed()) {
          contents.push(viewContents);
        }
      }
    }
  }
  const managerWindow = credentialManagerController.getWindow?.();
  if (managerWindow && !managerWindow.isDestroyed()) {
    contents.push(managerWindow.webContents);
  }
  return contents;
};

const broadcastCredentialManagerRefresh = () => {
  collectTabWebContents().forEach((contents) => {
    try {
      contents.send?.('credential-manager:refresh');
    } catch (error) {
      log.warn('Failed to broadcast credential refresh', error);
    }
  });
};

registerPrinterHandlers({
  ipcMain,
  credentialRegistry,
  broadcastCredentialManagerRefresh,
  log
});

/* ====== STRONGER: open URL in a new tab with explicit logs + focus ====== */
const handleOpenUrlInTab = (url) => {
  const normalized = normalizeDeepLink(url) || url;
  if (!normalized) {
    log.warn('[deeplink] ignored invalid url:', url);
    return;
  }

  log.info('[deeplink] request to open:', normalized);

  if (tabManager) {
    let createdId = null;
    try {
      createdId = tabManager.createTab(normalized);
      log.info('[deeplink] createTab returned id:', createdId);
    } catch (e) {
      log.error('[deeplink] createTab threw:', e);
    }

    if (createdId != null) {
      try { tabManager.setActiveTab(createdId); }
      catch (e) { log.warn('[deeplink] setActiveTab failed:', e); }
    } else {
      log.warn('[deeplink] createTab returned null/undefined');
    }

    if (mainWindow) {
      try {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.moveTop?.();
      } catch (e) {
        log.warn('[deeplink] focusing mainWindow failed:', e);
      }
    }
  } else {
    log.warn('[deeplink] tabManager not ready, queuing:', normalized);
    pendingDeepLinks.push(normalized);
  }
};

app.on('second-instance', (_event, argv) => {
  log.info('[second-instance] argv =', argv);
  const url = extractUrlFromArgs(argv);
  log.info('[second-instance] parsed url =', url); // <— added instrumentation
  if (url) {
    handleOpenUrlInTab(url);
  } else if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

const normalizeThemeColor = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  let hex = value.trim();
  if (!hex.startsWith('#')) {
    return null;
  }
  hex = hex.slice(1);
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }
  return null;
};

const sendThemeToContents = (contents) => {
  if (contents && !contents.isDestroyed()) {
    contents.send('theme:update', themeState);
  }
};

const auxiliaryThemeWindows = () => [
  bookmarkQuickController.getWindow?.(),
  gitController.getWindow?.(),
  settingsController.getWindow?.(),
  credentialFormController.getWindow?.(),
  credentialManagerController.getWindow?.(),
  downloadsController.getWindow?.(),
  profileController.getWindow?.(),
  suggestionsController.getWindow?.()
];

const broadcastTheme = () => {
  for (const ctx of windowRegistry.values()) {
    if (ctx.win && !ctx.win.isDestroyed()) {
      sendThemeToContents(ctx.win.webContents);
    }
  }
  auxiliaryThemeWindows()
    .filter((win) => win && !win.isDestroyed())
    .forEach((win) => sendThemeToContents(win.webContents));
};

const broadcastHistoryEntries = (entries) => {
  for (const ctx of windowRegistry.values()) {
    if (ctx.win && !ctx.win.isDestroyed()) {
      ctx.win.webContents.send('history:update', entries);
    }
  }
};

const broadcastBookmarkWindows = (entries) => {
  for (const ctx of windowRegistry.values()) {
    if (ctx.win && !ctx.win.isDestroyed()) {
      ctx.win.webContents.send('bookmarks:update', entries);
    }
  }
  bookmarkQuickController.broadcastBookmarks(entries);
};

const parseGithubTokenFromUrl = (urlObj) => {
  if (!urlObj) return null;
  const queryToken = urlObj.searchParams.get('access_token');
  if (queryToken) {
    return queryToken;
  }
  if (urlObj.hash) {
    const params = new URLSearchParams(urlObj.hash.replace(/^#/, ''));
    return params.get('access_token');
  }
  return null;
};

const persistGithubToken = async (token) => {
  if (!token) {
    return;
  }
  try {
    await keytar.setPassword(GITHUB_TOKEN_SERVICE, GITHUB_TOKEN_ACCOUNT, token);
    log.info('[GitHubAuth] Stored OAuth token via keytar');
  } catch (error) {
    log.warn('[GitHubAuth] Failed to persist token', error);
  }
};

const clearGithubToken = async () => {
  try {
    await keytar.deletePassword(GITHUB_TOKEN_SERVICE, GITHUB_TOKEN_ACCOUNT);
  } catch (error) {
    log.warn('[GitHubAuth] Failed to delete stored token', error);
  }
};

const clearGithubSessionData = async () => {
  const ses = session?.defaultSession;
  if (!ses) return;
  try {
    const storageOptions = { storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'caches'] };
    await Promise.all([
      ses.clearStorageData({ origin: 'https://github.com', ...storageOptions }),
      ses.clearStorageData({ origin: 'https://gist.github.com', ...storageOptions })
    ]);
    const cookies = await ses.cookies.get({ domain: 'github.com' });
    await Promise.all(
      cookies.map((cookie) => {
        const protocol = cookie.secure ? 'https://' : 'http://';
        const domain = cookie.domain?.startsWith('.') ? cookie.domain.slice(1) : cookie.domain || 'github.com';
        const pathName = cookie.path || '/';
        const url = `${protocol}${domain}${pathName}`;
        return ses.cookies.remove(url, cookie.name).catch(() => { });
      })
    );
  } catch (error) {
    log.warn('[GitHubAuth] Failed clearing github.com storage', error);
  }
  await clearGithubToken();
};

const isGithubLogoutNavigation = (urlObj) => {
  if (!urlObj) return false;
  if (!urlObj.hostname || !urlObj.hostname.endsWith('github.com')) {
    return false;
  }
  if (GITHUB_LOGOUT_PATHS.has(urlObj.pathname)) {
    return true;
  }
  return urlObj.pathname === '/login' && urlObj.searchParams.has('logged_out');
};

const handleGithubNavigation = async (webContents, url) => {
  if (!url) return;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (!parsed.hostname || !parsed.hostname.endsWith('github.com')) {
    return;
  }

  const token = parseGithubTokenFromUrl(parsed);
  if (token) {
    await persistGithubToken(token);
  }

  if (isGithubLogoutNavigation(parsed)) {
    if (githubLogoutInProgress) return;
    githubLogoutInProgress = true;
    await clearGithubSessionData();
    if (webContents && !webContents.isDestroyed()) {
      webContents.loadURL(GITHUB_LOGIN_URL);
    }
    setTimeout(() => {
      githubLogoutInProgress = false;
    }, 500);
  }
};

const attachGithubTabHandlers = (tabId) => {
  if (!tabManager || typeof tabManager.getTab !== 'function') {
    return;
  }
  const tab = tabManager.getTab(tabId);
  const contents = tab?.view?.webContents;
  if (!contents) {
    return;
  }
  if (githubTabCleanups.has(tabId)) {
    const dispose = githubTabCleanups.get(tabId);
    dispose?.();
  }

  const navHandler = (_event, targetUrl) => {
    handleGithubNavigation(contents, targetUrl);
  };

  contents.on('did-navigate', navHandler);
  contents.on('did-navigate-in-page', navHandler);
  contents.on('will-navigate', navHandler);

  const cleanup = () => {
    contents.removeListener('did-navigate', navHandler);
    contents.removeListener('did-navigate-in-page', navHandler);
    contents.removeListener('will-navigate', navHandler);
    githubTabCleanups.delete(tabId);
    if (githubTabId === tabId) {
      githubTabId = null;
    }
  };

  contents.once('destroyed', cleanup);
  githubTabCleanups.set(tabId, cleanup);
};


const openGithubLoginTab = async () => {
  if (!tabManager) return null;
  if (githubTabId && typeof tabManager.getTab === 'function') {
    const existing = tabManager.getTab(githubTabId);
    if (existing) {
      tabManager.setActiveTab?.(githubTabId);
      const contents = existing.view?.webContents;
      if (contents && !contents.isDestroyed()) {
        contents.loadURL(GITHUB_LOGIN_URL);
      }
      return githubTabId;
    }
  }
  const newTabId = tabManager.createTab(GITHUB_LOGIN_URL);
  if (typeof newTabId === 'number') {
    githubTabId = newTabId;
    attachGithubTabHandlers(newTabId);
  }
  return newTabId;
};

const loadThemeFromDisk = async () => {
  try {
    themeState = await readThemeFile();
  } catch (error) {
    log.warn('Failed to load theme config', error);
    themeState = { ...DEFAULT_THEME };
  }
};

const formatGitRow = (entry = {}, source = 'store') => {
  const owner = (entry.owner || entry.repositoryOwner || '').trim();
  const repository = (entry.repository || entry.repo || '').trim();
  const label = owner && repository ? `${owner}/${repository}` : 'Git Credentials';
  const configured = Boolean(owner && repository && (entry.pat || entry.token) && (entry.defaultPath || entry.path));
  return {
    id: entry.id || `git-${source}`,
    entryType: 'git',
    entrySource: source,
    name: entry.label || label,
    type: 'GIT',
    summary: label,
    configured
  };
};

const formatDatabaseRow = (entry = {}, source = 'store') => {
  const dbType = (entry.dbType || entry.type || '').toUpperCase();
  const dbName = (entry.connectionName || entry.label || '').trim() || 'Database Credentials';
  const summaryParts = [];
  if (entry.user) summaryParts.push(entry.user);
  if (entry.host) summaryParts.push(entry.host);
  const summary = summaryParts.join(' - ');
  const configured = Boolean((entry.dbType || '').length && (entry.host || '').length && (entry.user || '').length);
  return {
    id: source === 'registry' ? entry.id : entry.customId || entry.id || `database-${source}`,
    entryType: 'database',
    entrySource: source,
    name: dbName,
    type: dbType || 'DATABASE',
    summary,
    configured
  };
};

const formatOtherRow = (entry = {}) => ({
  id: entry.id,
  entryType: 'other',
  entrySource: 'registry',
  name: entry.label || 'Other Credential',
  type: 'OTHER',
  summary: entry.description || '',
  configured: Boolean(entry.secret)
});

const formatPrinterRow = (entry = {}) => {
  const summaryParts = [
    entry.printerType && entry.printerType.toUpperCase(),
    entry.printerModel,
    entry.companyName,
    entry.printerPort ? `Port ${entry.printerPort}` : ''
  ];
  return {
    id: entry.id,
    entryType: 'printer',
    entrySource: 'registry',
    name: entry.label || entry.printerName || entry.deviceName || 'Printer',
    type: 'PRINTER',
    summary: summaryParts.filter(Boolean).join(' - '),
    configured: Boolean(entry.deviceName || entry.printerName)
  };
};

const buildCredentialRows = async () => {
  const rows = [];
  let registryGitCount = 0;
  let registryDbCount = 0;
  try {
    const registry = await credentialRegistry.listAll();
    registry.git.forEach((entry) => rows.push(formatGitRow(entry, 'registry')));
    registry.database.forEach((entry) => rows.push(formatDatabaseRow(entry, 'registry')));
    registry.other.forEach((entry) => rows.push(formatOtherRow(entry)));
    registry.printer?.forEach((entry) => rows.push(formatPrinterRow(entry)));
    registryGitCount = registry.git.length;
    registryDbCount = registry.database.length;
  } catch (error) {
    log.error('Failed to load credential registry', error);
  }
  if (registryGitCount === 0) {
    try {
      const gitConfig = await githubManager.loadConfig();
      const gitRow = formatGitRow(gitConfig, 'store');
      if (gitRow.configured) rows.push(gitRow);
    } catch (error) {
      log.warn('Failed to load default Git credentials', error);
    }
  }
  if (registryDbCount === 0) {
    try {
      const dbConfig = await credentialStore.loadConfig();
      const dbRow = formatDatabaseRow(dbConfig, 'store');
      if (dbRow.configured) rows.push(dbRow);
    } catch (error) {
      log.warn('Failed to load default database credentials', error);
    }
  }
  return rows;
};

// Builds a BrowserWindow and wires a TabManager plus lifecycle handlers.
const createWindow = (initialUrl = DEFAULT_HOME) => {
  const isFirstWindow = !mainWindow;
  if (isFirstWindow) nativeTheme.themeSource = 'light';
  log('Creating window (first=%s)', isFirstWindow);

  const isMac = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';

  const isFrameless = !isMac;
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    show: false,
    useContentSize: true,
    transparent: isMac,
    hasShadow: true,
    frame: isFrameless ? false : true,
    titleBarStyle: 'hidden',
    titleBarOverlay: isWindows
      ? {
        ...getSkinTitleBarColor(themeState.skin || 'glass', nativeTheme.shouldUseDarkColors),
        height: 32
      }
      : isMac
        ? {
          color: '#eedcfb',
          symbolColor: '#1c1f26',
          height: 0
        }
        : undefined,
    backgroundColor: isMac ? '#00000000' : '#f5f0fa',
    autoHideMenuBar: true,
    icon: path.join(__dirname, isWindows ? '../../build/icon.ico' : '../../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  snapManager.init(win);

  if (app.isPackaged && !updaterInitialized) {
    initUpdater(win);
    updaterInitialized = true;
  }

  // Set up media permission handling (mic/camera) once per session.
  if (isFirstWindow) {
    try {
      registerMediaPermissionHandler(session.defaultSession);
    } catch (err) {
      log.warn('Failed to register media permission handler', err);
    }
  }

  // give the popup module a getter for the main window
  if (isFirstWindow) tabMenuPopup.init(() => mainWindow);

  win.webContents.on('render-process-gone', (_event, details) => {
    log.error('[FATAL] Main renderer crashed:', details?.reason);
    try { if (!win.isDestroyed()) win.webContents.reload(); } catch (_) { /* best effort */ }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  // Disable pinch zoom on the chrome itself; we handle content zoom manually in the renderer.
  try {
    win.webContents.setVisualZoomLevelLimits(1, 1);
    win.webContents.setLayoutZoomLevelLimits(0, 0);
    win.webContents.setZoomFactor(1);
  } catch (_) {
    // best effort
  }
  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.maximize();
      win.show();
      sendWindowState(win);
    }
  });
  const winStateHandler = () => sendWindowState(win);
  win.on('maximize', winStateHandler);
  win.on('unmaximize', winStateHandler);
  win.on('enter-full-screen', winStateHandler);
  win.on('leave-full-screen', winStateHandler);
  win.webContents.once('did-finish-load', () => {
    sendThemeToContents(win.webContents);
  });
  win.webContents.on('context-menu', (event, params) => {
    event.preventDefault();
    // Show context menu on home page content area
    const ctx = windowRegistry.get(win.id);
    const tm = ctx?.tabManager;
    if (!tm) return;
    const template = [
      { label: 'Back', enabled: false, click: () => {} },
      { label: 'Forward', enabled: false, click: () => {} },
      { label: 'Reload', click: () => tm.reload() },
      { type: 'separator' },
      {
        label: 'Inspect element',
        click: () => {
          if (!win.webContents.isDevToolsOpened()) {
            win.webContents.openDevTools({ mode: 'detach' });
          }
          win.webContents.inspectElement(params.x, params.y);
        }
      }
    ];
    Menu.buildFromTemplate(template).popup({ window: win });
  });
  win.webContents.on('devtools-opened', () => {
    const dtWc = win.webContents.devToolsWebContents;
    if (dtWc && !dtWc.isDestroyed()) {
      dtWc.on('context-menu', (e, params) => {
        e.preventDefault();
        const items = [];
        if (params.selectionText) {
          items.push({ label: 'Copy', click: () => clipboard.writeText(params.selectionText) });
        }
        items.push({ label: 'Select All', role: 'selectAll' });
        Menu.buildFromTemplate(items).popup();
      });
    }
  });

  // Per-window TabManager (created before keyboard handler so it's available in closures)
  const winTabManager = new TabManager(
    win,
    (payload) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('tabs:state', payload);
      }
    },
    broadcastHistoryEntries,
    (url) => launchNewInstance(url),
    (enabled) => syncAppFullscreen(enabled, win)
  );

  // Register in the multi-window registry
  windowRegistry.set(win.id, { win, tabManager: winTabManager });

  // Keep the global pointers up-to-date
  if (isFirstWindow) {
    mainWindow = win;
    tabManager = winTabManager;
  }

  // Route Ctrl+Shift+I to the renderer DevTools so the chrome can be inspected.
  win.webContents.on('before-input-event', (event, input) => {
    const isCmdOrCtrl = process.platform === 'darwin' ? input.meta : input.control;
    const isShift = input.shift;

    if (input.type === 'keyDown' && input.code === 'Escape' && win.isFullScreen()) {
      event.preventDefault();
      syncAppFullscreen(false, win);
      const activeTab = winTabManager.activeTab;
      const contents = activeTab?.view?.webContents;
      contents?.executeJavaScript(`if (document.fullscreenElement) document.exitFullscreen();`).catch(() => { });
      return;
    }
    if (input.type === 'keyDown' && input.code === 'F11') {
      event.preventDefault();
      const next = !win.isFullScreen();
      syncAppFullscreen(next, win);
      if (!next) {
        const activeTab = winTabManager.activeTab;
        const contents = activeTab?.view?.webContents;
        contents?.executeJavaScript(`if (document.fullscreenElement) document.exitFullscreen();`).catch(() => { });
      }
      return;
    }
    if (input.type === 'keyDown' && isCmdOrCtrl && isShift && input.code === 'KeyJ') {
      event.preventDefault();
      if (!win.webContents.isDestroyed()) {
        win.webContents.openDevTools({ mode: 'bottom' });
        labelDevToolsWindow(win.webContents, 'Chrome DevTools');
        log('Renderer DevTools opened via keyboard');
      }
    }
  });

  registerShortcutManager(win, winTabManager, () => launchNewInstance(DEFAULT_HOME));

  win.on('resize', () => winTabManager.resizeActiveView());
  win.on('close', () => {
    winTabManager.saveSession?.();
  });
  win.on('closed', () => {
    // Clean up this window from the registry
    windowRegistry.delete(win.id);
    winTabManager.destroy();

    // If this was the primary window, promote another or clear globals
    if (mainWindow === win) {
      const remaining = Array.from(windowRegistry.values());
      if (remaining.length > 0) {
        mainWindow = remaining[0].win;
        tabManager = remaining[0].tabManager;
      } else {
        mainWindow = null;
        tabManager = null;
      }
    }

    // Destroy popup controllers only when ALL windows are gone
    if (windowRegistry.size === 0) {
      bookmarkQuickController.destroy();
      gitController.destroy();
      settingsController.destroy();
      credentialManagerController.destroy();
      credentialFormController.destroy();
      tabMenuPopup.destroyIfAny();
      downloadsController.destroy();
      profileController.destroy();
      suggestionsController.destroy();
      securityPopoverController.destroy();
    }
  });

  winTabManager.createInitialTab(initialUrl);
  if (isFirstWindow) winTabManager.loadSession();
  broadcastBookmarkWindows(bookmarkStore.getAll());

  win.webContents.on('enter-html-full-screen', () => {
    syncAppFullscreen(true, win);
  });

  win.webContents.on('leave-html-full-screen', () => {
    syncAppFullscreen(false, win);
  });

  return win;
};

const openPopupDevTools = () => {
  const popupWindows = [
    bookmarkQuickController.getWindow(),
    gitController.getWindow(),
    settingsController.getWindow(),
    downloadsController.getWindow(),
    securityPopoverController.getWindow()
  ];
  popupWindows.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.webContents.openDevTools({ mode: 'bottom' });
    }
  });
};

// Tab controls exposed to the renderer through the preload bridge.
ipcMain.handle('tabs:new', (event) => {
  const ctx = getContextForEvent(event);
  const id = ctx.tabManager?.createTab(DEFAULT_HOME);
  if (ctx.win && !ctx.win.isDestroyed()) {
    ctx.win.webContents.send('shortcuts:focus-address', { selectAll: true });
  }
  return id;
});
ipcMain.handle('tabs:activate', (event, tabId) => getContextForEvent(event).tabManager?.setActiveTab(tabId));
ipcMain.handle('tabs:close', (event, tabId) => getContextForEvent(event).tabManager?.destroyTab(tabId));
ipcMain.handle('tabs:navigate', (event, input) => getContextForEvent(event).tabManager?.navigateActiveTab(input));
ipcMain.handle('tabs:reload', (event) => getContextForEvent(event).tabManager?.reload());
ipcMain.handle('tabs:back', (event) => getContextForEvent(event).tabManager?.goBack());
ipcMain.handle('tabs:forward', (event) => getContextForEvent(event).tabManager?.goForward());
ipcMain.handle('tabs:detach', (event, tabId) => getContextForEvent(event).tabManager?.detachTab(tabId));
ipcMain.handle('tabs:print', (event) => getContextForEvent(event).tabManager?.printActive());
ipcMain.handle('tabs:get-zoom', (event) => getContextForEvent(event).tabManager?.getActiveZoom());
ipcMain.handle('tabs:set-zoom', (event, factor) => getContextForEvent(event).tabManager?.setActiveZoom(factor));
ipcMain.handle('tabs:zoom-in', (event) => getContextForEvent(event).tabManager?.nudgeActiveZoom(1));
ipcMain.handle('tabs:zoom-out', (event) => getContextForEvent(event).tabManager?.nudgeActiveZoom(-1));
ipcMain.handle('tabs:zoom-reset', (event) => getContextForEvent(event).tabManager?.setActiveZoom(1));
ipcMain.handle('tabs:reopen-last', (event) => getContextForEvent(event).tabManager?.reopenLastClosed());
ipcMain.handle('chrome:update-offset', (event, height) => getContextForEvent(event).tabManager?.updateTopOffset(height));
// Pin / Close Others / Close Right handlers for tab context menu
ipcMain.handle('tabs:pin', (event, tabId) => getContextForEvent(event).tabManager?.togglePin(tabId));
ipcMain.handle('tabs:close-others', (event, tabId) => getContextForEvent(event).tabManager?.closeOtherTabs(tabId));
ipcMain.handle('tabs:close-right', (event, tabId) => getContextForEvent(event).tabManager?.closeTabsToRight(tabId));
ipcMain.handle('tabs:reload-tab', (event, tabId) => getContextForEvent(event).tabManager?.reloadTab(tabId));
ipcMain.handle('tabs:duplicate', (event, tabId) => getContextForEvent(event).tabManager?.duplicateTab(tabId));
ipcMain.handle('tabs:move-to-window', (event, tabId) => {
  const ctx = getContextForEvent(event);
  const tm = ctx?.tabManager;
  if (!tm) return;
  const tab = tm.tabs.get(tabId);
  if (!tab) return;
  const url = tab.url || tab.view.webContents.getURL();
  tm.destroyTab(tabId);
  if (typeof tm.launchDetachedWindow === 'function') {
    tm.launchDetachedWindow(url);
  }
});
ipcMain.handle('tabs:move', (event, { tabId, beforeTabId }) =>
  getContextForEvent(event).tabManager?.moveTab(tabId, beforeTabId)
);
ipcMain.handle('tabs:cycle', (event, delta = 1) => getContextForEvent(event).tabManager?.cycleTab?.(delta));

// Set pin state directly
ipcMain.handle('tabs:setPinned', (event, { tabId, pinned }) => {
  getContextForEvent(event).tabManager?.setPinned?.(tabId, pinned);
});

ipcMain.handle('tabs:find', (event, text) => getContextForEvent(event).tabManager?.findInPage(text));
ipcMain.handle('tabs:stop-find', (event) => getContextForEvent(event).tabManager?.stopFindInPage());

// Quit whole app from renderer
ipcMain.handle('app:quit', () => {
  log('main: app.quit() requested');
  app.quit();
});

// IPC endpoints for the overlaying tab context menu and suggestions
ipcMain.handle('tabmenu:toggle-popup', (_, bounds, payload) => tabMenuPopup.toggle(bounds, payload));
ipcMain.handle('tabmenu:close-popup', () => tabMenuPopup.hide());
ipcMain.handle('suggestions:toggle-popup', (_evt, bounds, payload) =>
  suggestionsController.toggleWindow(bounds, payload)
);
ipcMain.handle('suggestions:update', (_evt, payload) => suggestionsController.update(payload));
ipcMain.handle('suggestions:hide', () => suggestionsController.hide());
ipcMain.handle('security:show', (_evt, bounds, payload) =>
  securityPopoverController.show(bounds, payload)
);
ipcMain.handle('security:update', (_evt, payload) => securityPopoverController.update(payload));
ipcMain.handle('security:hide', () => securityPopoverController.hide());

/* ================== NEW WINDOW ================== */
ipcMain.handle('window:new', () => {
  launchNewInstance(DEFAULT_HOME);
});
/* =============================================== */

// App version for renderer (settings panel)
ipcMain.handle('app:get-version', () => app.getVersion());

/* ============= DEFAULT BROWSER HELPERS ============= */
ipcMain.handle('app:set-default-browser', async () => {
  const result = { http: false, https: false };
  try {
    result.http = app.setAsDefaultProtocolClient('http');
    result.https = app.setAsDefaultProtocolClient('https');
  } catch (e) {
    result.error = String(e?.message || e);
  }
  try {
    if (process.platform === 'win32') {
      await shell.openExternal('ms-settings:defaultapps');
    } else if (process.platform === 'darwin') {
      await shell.openExternal('x-apple.systempreferences:com.apple.preference.general?DefaultWebBrowser');
    }
  } catch (_) { }
  return result;
});
/* ==================================================== */

// History popup coordination.
ipcMain.handle('history:get', () => historyStore.getHistory());
ipcMain.handle('history:clear', (event) => {
  historyStore.clear();
  log('History cleared');
  getContextForEvent(event).tabManager?.emitHistoryUpdate();
});

// Bookmark star/popup coordination.
ipcMain.handle('bookmarks:get', () => bookmarkStore.getAll());
ipcMain.handle('bookmarks:toggle', (_, entry) => {
  const result = bookmarkStore.toggle(entry);
  log('Bookmark toggled', entry?.url);
  broadcastBookmarkWindows(bookmarkStore.getAll());
  return result;
});
ipcMain.handle('bookmarks:save', (_, entry) => {
  const saved = bookmarkStore.upsert(entry);
  if (saved) {
    log('Bookmark saved', saved.url, saved.folder);
    broadcastBookmarkWindows(bookmarkStore.getAll());
  }
  return saved;
});
ipcMain.handle('bookmarks:remove', (_, payload) => {
  const removed = bookmarkStore.remove(payload);
  if (removed) {
    const label = typeof payload === 'string' ? payload : payload?.url || payload?.id;
    log('Bookmark removed', label);
    broadcastBookmarkWindows(bookmarkStore.getAll());
  }
  return removed;
});
ipcMain.handle('bookmarks:clear', () => {
  bookmarkStore.clear();
  log('Bookmarks cleared');
  broadcastBookmarkWindows(bookmarkStore.getAll());
});
ipcMain.handle('bookmarks:toggle-quick', (_event, bounds, context) =>
  bookmarkQuickController.toggleQuickWindow(bounds, context)
);
ipcMain.handle('bookmarks:close-quick', () => bookmarkQuickController.closeQuickWindow());
ipcMain.handle('bookmarks:update-quick-context', (_event, context) =>
  bookmarkQuickController.sendContext(context || {})
);
ipcMain.handle('github:open-login-tab', () => openGithubLoginTab());
ipcMain.handle('credentials:toggle-popup', (_, bounds) => credentialManagerController.toggleWindow(bounds));
ipcMain.handle('credentials:close-popup', () => credentialManagerController.closeWindow());
ipcMain.handle('credentials:open-form', (_, bounds) => credentialFormController.openWindow(bounds));
ipcMain.handle('credentials:close-form', () => credentialFormController.closeWindow());

ipcMain.handle('credentials:list', async () => buildCredentialRows());
ipcMain.handle('credentials:get', () => credentialStore.loadConfig());
ipcMain.handle('credentials:save', async (_event, payload = {}) => {
  const normalized = {
    customId: (payload.id || payload.customId || '').trim(),
    label: (payload.label || payload.connectionName || '').trim(),
    connectionName: (payload.connectionName || payload.label || '').trim(),
    dbType: (payload.dbType || '').trim(),
    host: (payload.host || '').trim(),
    port: (payload.port || '').trim(),
    database: (payload.database || '').trim(),
    user: (payload.user || '').trim(),
    password: payload.password || '',
    ssh: { ...(payload.ssh || {}) },
    ssl: { ...(payload.ssl || {}) },
    iam: { ...(payload.iam || {}) }
  };
  const shouldRegistry = !payload.__skipRegistry && (payload.__registry || payload.__entryId);
  if (shouldRegistry) {
    const entry = await credentialRegistry.upsert('database', {
      id: payload.__entryId,
      ...normalized,
      customId: normalized.customId,
      label: normalized.label || normalized.database || normalized.host || 'Database Credential',
      connectionName: normalized.connectionName
    });
    broadcastCredentialManagerRefresh();
    return { ...normalized, __entryId: entry.id };
  }
  const saved = await credentialStore.saveConfig(normalized);
  broadcastCredentialManagerRefresh();
  return saved;
});
ipcMain.handle('credentials:test', (_event, payload = {}) => credentialStore.testConnection(payload));
ipcMain.handle('credentials:entry:get', async (_event, { type, id }) => {
  if (type === 'usb-scan') {
    const UsbPrinterConnector = require('./connectors/UsbPrinterConnector');
    return UsbPrinterConnector.listDevices();
  }
  if (type === 'printer-status') {
    const { checkPrinterPhysical } = require('./printerStatusChecker');
    const printers = await credentialRegistry.list('printer');
    const entry = printers.find(p => (p.printerName || p.deviceName) === id);
    if (!entry) return { online: false, status: 'Printer not found' };
    return checkPrinterPhysical(entry);
  }
  return credentialRegistry.get(type, id);
});
ipcMain.handle('credentials:entry:delete', async (_event, { type, id }) => {
  const removed = await credentialRegistry.remove(type, id);
  if (removed) {
    broadcastCredentialManagerRefresh();
  }
  return removed;
});
// --- License Key IPC ---
ipcMain.handle('licenseKey:list', async () => licenseKeyStore.list());
ipcMain.handle('licenseKey:save', async (_event, entry) => licenseKeyStore.save(entry));
ipcMain.handle('licenseKey:delete', async (_event, id) => licenseKeyStore.remove(id));

ipcMain.handle('credentials:other:save', async (_event, payload = {}) => {
  const entry = await credentialRegistry.upsert('other', {
    id: payload.id,
    label: (payload.label || '').trim() || 'Other Credential',
    description: (payload.description || '').trim(),
    secret: payload.secret || ''
  });
  broadcastCredentialManagerRefresh();
  return entry;
});
// Printer credential IPC moved into printerController

// Git integration commands for the popup UI.
ipcMain.handle('git:toggle-popup', (_, bounds) => gitController.toggleGitWindow(bounds));
ipcMain.handle('git:close-popup', () => gitController.closeGitWindow());
ipcMain.handle('settings:toggle-popup', (_, bounds) => settingsController.toggleSettingsWindow(bounds));
ipcMain.handle('settings:close-popup', () => settingsController.closeSettingsWindow());
ipcMain.handle('settings:resize', (_evt, height) => settingsController.resizeSettingsWindow?.(height));
ipcMain.handle('github:get-config', async () => {
  const stored = (await githubManager.loadConfig()) || {};
  const hasStoredConfig = Boolean(stored.owner && stored.repository && (stored.pat || stored.token) && stored.defaultPath);
  if (hasStoredConfig) {
    return stored;
  }
  try {
    const normalizeGitEntry = (entry) => {
      if (!entry) return null;
      const owner = String(entry.owner || entry.repositoryOwner || '').trim();
      const repository = String(entry.repository || entry.repo || '').trim();
      const branch = String(entry.branch || '').trim() || 'main';
      const defaultPath = String(entry.defaultPath || entry.path || '').trim();
      const pat = String(entry.pat || entry.token || '').trim();
      const defaultCommitMessage = String(entry.defaultCommitMessage || entry.commitMessage || '').trim() || 'chore: push from Chromo';

      if (!owner || !repository || !defaultPath || !pat) {
        return null;
      }

      return {
        owner,
        repository,
        branch,
        defaultPath,
        defaultCommitMessage,
        pat,
        __entryId: entry.id
      };
    };

    const entries = (await credentialRegistry.list('git')) || [];
    const sorted = entries.slice().sort((a, b) => {
      const aTime = Number(a?.updatedAt || a?.createdAt || 0);
      const bTime = Number(b?.updatedAt || b?.createdAt || 0);
      return bTime - aTime;
    });
    const best = sorted.map(normalizeGitEntry).find(Boolean);
    if (best) {
      return best;
    }
  } catch (error) {
    log.warn('[github:get-config] failed to fallback to registry config', error);
  }
  return stored;
});
ipcMain.handle('github:save-config', async (_, config) => {
  const saved = await githubManager.saveConfig(config);
  const shouldRegistry =
    config && !config.__skipRegistry && (config.__registry || config.__entryId || config?.mode === 'new');
  if (shouldRegistry) {
    const registryEntry = await credentialRegistry.upsert('git', {
      id: config.__entryId,
      owner: saved.owner || config.owner || '',
      repository: saved.repository || config.repository || '',
      branch: saved.branch || config.branch || '',
      defaultPath: saved.defaultPath || config.defaultPath || '',
      defaultCommitMessage: saved.defaultCommitMessage || config.defaultCommitMessage || '',
      pat: saved.pat || config.pat || '',
      label: config.label || `${saved.owner || config.owner || ''}/${saved.repository || config.repository || ''}`
    });
    broadcastCredentialManagerRefresh();
    return { ...saved, __entryId: registryEntry.id };
  }
  broadcastCredentialManagerRefresh();
  return saved;
});
ipcMain.handle('github:sign-out', async () => {
  await githubManager.signOut();
  broadcastCredentialManagerRefresh();
});
ipcMain.handle('github:push', async (_, payload) => githubManager.pushContent(payload));
ipcMain.handle('github:pull', async () => githubManager.pullContent());
ipcMain.handle('github:log-message', (_evt, entry) => {
  if (entry) {
    log.info('[GitHub][renderer]', entry);
  }
  return true;
});
// Title-bar proxy handlers keep the custom chrome working.
ipcMain.handle('window:minimize', (event) => getContextForEvent(event).win?.minimize());
ipcMain.handle('window:toggle-maximize', (event) => {
  const { win } = getContextForEvent(event);
  if (!win) return false;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
  return win.isMaximized();
});
ipcMain.handle('window:close', (event) => getContextForEvent(event).win?.close());
ipcMain.handle('update:check', async () => {
  if (!app.isPackaged || !updaterInitialized) {
    return { ok: false, error: 'Updates available in packaged builds only.' };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
});
ipcMain.handle('update:install', () => {
  if (!app.isPackaged || !updaterInitialized) {
    return { ok: false, error: 'Updates available in packaged builds only.' };
  }
  try {
    autoUpdater.quitAndInstall();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
});
ipcMain.handle('window:toggle-devtools', (event) => getContextForEvent(event).tabManager?.toggleDevTools());
// Open chrome (header) DevTools only to avoid spawning multiple windows.
ipcMain.handle('window:open-devtools', (event) => {
  const { win } = getContextForEvent(event);
  if (win && !win.webContents.isDestroyed()) {
    win.webContents.openDevTools({ mode: 'bottom' });
    labelDevToolsWindow(win.webContents, 'Chrome DevTools');
    log('Renderer DevTools opened');
  }
});
ipcMain.handle('window:open-renderer-devtools', (event) => {
  settingsController.closeSettingsWindow();
  const ctx = getContextForEvent(event);
  const win = ctx.win || mainWindow;
  const tm = ctx.tabManager || tabManager;
  setTimeout(() => {
    if (!win || win.isDestroyed() || !tm) return;
    win.focus();
    const tab = tm.tabs?.get(tm.activeTabId);
    const wc = tab?.view?.webContents;
    const tabUrl = wc && !wc.isDestroyed() ? (wc.getURL() || '') : '';
    const isHomePage = !tabUrl || tabUrl === 'about:blank';
    if (isHomePage) {
      // Home page content is in win.webContents; detach mode for frameless window
      if (!win.webContents.isDevToolsOpened()) {
        win.webContents.openDevTools({ mode: 'detach' });
      }
    } else {
      // Regular tab: dock DevTools at bottom
      if (!wc || wc.isDestroyed()) return;
      if (wc.isDevToolsOpened()) wc.closeDevTools();
      wc.focus();
      wc.openDevTools({ mode: 'bottom' });
      wc.inspectElement(0, 0);
    }
  }, 300);
});
ipcMain.handle('windows:open-popup-devtools', () => openPopupDevTools());
ipcMain.handle('theme:get', () => themeState);
ipcMain.handle('theme:set', async (_event, colorValue) => {
  const normalized = normalizeThemeColor(colorValue);
  if (!normalized) {
    throw new Error('Invalid color format');
  }
  themeState = { color: normalized };
  try {
    await writeThemeFile(themeState);
  } catch (error) {
    log.warn('Failed to persist theme config', error);
  }
  broadcastTheme();
  return themeState;
});
ipcMain.handle('theme:set-mode', (_event, mode) => {
  const valid = mode === 'dark' || mode === 'light' || mode === 'system';
  if (!valid) return nativeTheme.themeSource;
  nativeTheme.themeSource = mode;
  // Sync native titleBarOverlay colors with the new theme on ALL windows
  if (process.platform === 'win32') {
    const isDark = mode === 'dark' || (mode === 'system' && nativeTheme.shouldUseDarkColors);
    const { color, symbolColor } = getSkinTitleBarColor(themeState.skin || 'glass', isDark);
    for (const ctx of windowRegistry.values()) {
      if (ctx.win && !ctx.win.isDestroyed()) {
        try {
          ctx.win.setTitleBarOverlay({ color, symbolColor });
        } catch (_) { /* best effort */ }
      }
    }
  }
  return nativeTheme.themeSource;
});

const SKIN_COLORS = {
  glass: { light: '#f5f8ff', dark: '#0c1220' },
  classic: { light: '#f7f2fb', dark: '#141a28' }
};

const getSkinTitleBarColor = (skin, isDark) => {
  const palette = SKIN_COLORS[skin] || SKIN_COLORS.glass;
  return {
    color: isDark ? palette.dark : palette.light,
    symbolColor: isDark ? '#e2e8f0' : '#2c1a4a'
  };
};

ipcMain.handle('titlebar:update-skin', async (_event, skin) => {
  // Persist skin so main process knows on next startup
  try {
    const theme = await readThemeFile();
    theme.skin = skin || 'glass';
    await writeThemeFile(theme);
  } catch (_) { /* best effort */ }

  if (process.platform !== 'win32') return;
  const { color, symbolColor } = getSkinTitleBarColor(skin, nativeTheme.shouldUseDarkColors);
  for (const ctx of windowRegistry.values()) {
    if (ctx.win && !ctx.win.isDestroyed()) {
      try {
        ctx.win.setTitleBarOverlay({ color, symbolColor });
      } catch (_) { /* best effort */ }
    }
  }
});

/* ========================== GLOBAL ERROR HANDLERS ========================== */
process.on('uncaughtException', (err) => {
  log.error('[FATAL] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  log.error('[FATAL] Unhandled promise rejection:', reason);
});

/* ========================== APP LIFECYCLE ========================== */
app.whenReady().then(async () => {
  applyCleanUserAgent();
  await loadThemeFromDisk();
  log('App ready');

  // Best-effort: register as default protocol client (Windows/macOS)
  try {
    const httpOk = app.setAsDefaultProtocolClient('http');
    const httpsOk = app.setAsDefaultProtocolClient('https');
    log.info('[default-protocol] http:', httpOk, 'https:', httpsOk);
  } catch (e) {
    log.warn('[default-protocol] failed:', e);
  }

  log.info('[Startup] process.argv =', process.argv);

  const deepLinkUrl = extractUrlFromArgs(process.argv); // uses normalization + file:// fallback
  const initialUrl = deepLinkUrl || parseInitialUrlArg();
  log.info('[initialUrl]', initialUrl || '(none)');

  createWindow(initialUrl);

  // Register DevTools keyboard shortcuts — route to active tab's DevTools
  globalShortcut.register('F12', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;
    const ctx = windowRegistry.get(focusedWindow.id);
    if (ctx?.tabManager) {
      ctx.tabManager.toggleDevTools();
    }
  });

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;
    const ctx = windowRegistry.get(focusedWindow.id);
    if (ctx?.tabManager) {
      ctx.tabManager.openDevTools();
    }
  });

  downloadsController.setupDownloadListener();

  // Scheduler IPC + background loop
  try {
    registerSchedulerIpc(ipcMain, { scheduler, app, log });
    await scheduler.startSchedulerService({ app, log });
  } catch (err) {
    log.error('[Scheduler] failed to initialize', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Handle any queued deep links after main window/tab manager is ready
  if (pendingDeepLinks.length) {
    pendingDeepLinks.forEach((url) => handleOpenUrlInTab(url));
    pendingDeepLinks = [];
  }
});

// Always quit when all windows are closed (including macOS)
app.on('window-all-closed', () => {
  log('All windows closed, quitting');
  app.quit();
});

const labelDevToolsWindow = (targetWebContents, title) => {
  const devTools = targetWebContents?.devToolsWebContents;
  if (devTools && !devTools.isDestroyed()) {
    devTools.executeJavaScript(`document.title = ${JSON.stringify(title)};`).catch(() => { });
  }
};

/**
 * Handle JSON string coming from the test webpage via `window.externalMessage.send(jsonText)`
 */
ipcMain.handle('external-message', async (event, jsonText) => {
  log.info('[external-message] raw text from webpage:', jsonText);
  try {
    const data = JSON.parse(jsonText);
    log.debug('[external-message] parsed JSON object:', data);
    const senderUrl =
      event?.senderFrame?.url ||
      (typeof event?.sender?.getURL === 'function' ? event.sender.getURL() : '') ||
      '';

    let result;
    if (typeof handleExternalMessage === 'function') {
      result = await handleExternalMessage(data, {
        onHandshakeStatus: emitHandshakeStatus,
        handshakeContext: { url: senderUrl },
        replyTo: event?.senderFrame
      });
    }

    // Push result back to renderer as a fire-and-forget event for subscribers.
    try {
      const sender = event?.sender;
      if (sender && !sender.isDestroyed()) {
        event?.senderFrame?.send?.('external:result', result);
      }
    } catch (pushErr) {
      log.warn('[external-message] failed to push result to renderer:', pushErr);
    }

    return result;
  } catch (err) {
    log.error('[external-message] error:', err);
    const msg = err?.message || 'Invalid JSON';
    const failure = { ok: false, error: msg };
    try {
      event?.senderFrame?.send?.('external:result', failure);
    } catch (_) {
      // best effort
    }
    return failure;
  }
});

// Handle external / website-style messages via MessageHandler + ConnectorFactory
ipcMain.handle('external:message', async (event, message) => {
  try {
    return await handleExternalMessage(message);
  } catch (err) {
    log.error('[external:message] error:', err);
    return { ok: false, error: err?.message || String(err) };
  }
});


const ensureCustomDialogWindow = (parent) => {
  if (customDialogWindow && !customDialogWindow.isDestroyed()) {
    return customDialogWindow;
  }
  customDialogWindow = new BrowserWindow({
    width: 420,
    height: 220,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    frame: false,
    modal: !!parent,
    parent: parent || undefined,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  customDialogWindow.setMenuBarVisibility(false);
  customDialogWindow.loadFile(path.join(__dirname, '../renderer/dialog/index.html'));
  customDialogWindow.on('closed', () => {
    customDialogWindow = null;
  });
  return customDialogWindow;
};

ipcMain.handle('custom-dialog', async (event, payload = {}) => {
  const parent = BrowserWindow.fromWebContents(event.sender);
  const win = ensureCustomDialogWindow(parent);
  if (!win) return payload.type === 'confirm' ? false : undefined;

  return new Promise((resolve) => {
    let resolved = false;
    const done = (result) => { if (!resolved) { resolved = true; resolve(result); } };
    const responseHandler = (_evt, result) => {
      done(result);
    };
    ipcMain.once('custom-dialog:response', responseHandler);
    win.once('closed', () => {
      ipcMain.removeListener('custom-dialog:response', responseHandler);
      done(payload.type === 'confirm' ? false : undefined);
    });
    win.webContents.send('custom-dialog:show', {
      type: payload.type || 'alert',
      message: payload.message || ''
    });
    win.show();
    win.focus();
  });
});

ipcMain.handle('address:suggestions', async (_event, query = '') => {
  const term = String(query || '').trim().toLowerCase();
  if (!term) {
    return [];
  }
  const history = historyStore.getHistory?.() || [];
  const seen = new Set();
  const matches = [];
  const addSuggestion = (entry) => {
    if (!entry || !entry.url || seen.has(entry.url)) {
      return;
    }
    seen.add(entry.url);
    matches.push(entry);
  };
  for (const entry of history) {
    const title = entry.title || entry.url || '';
    const url = entry.url || '';
    if (title.toLowerCase().includes(term) || url.toLowerCase().includes(term)) {
      addSuggestion({
        title,
        url,
        source: 'history'
      });
    }
    if (matches.length >= 5) break;
  }
  // Sort: URLs whose domain starts with the typed text come first (best for auto-complete)
  matches.sort((a, b) => {
    const stripDomain = (u) => {
      try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return u.toLowerCase(); }
    };
    const aStarts = stripDomain(a.url).startsWith(term) ? 0 : 1;
    const bStarts = stripDomain(b.url).startsWith(term) ? 0 : 1;
    return aStarts - bStarts;
  });
  // If no history entries matched the query, fall back to showing a few recent history items
  if (matches.length === 0 && history.length) {
    history.slice(0, 3).forEach((entry) =>
      addSuggestion({
        title: entry.title || entry.url,
        url: entry.url,
        source: 'history'
      })
    );
  }

  if (matches.length < 5) {
    const remote = await fetchRemoteSuggestions(query);
    for (const suggestion of remote) {
      const suggestionUrl = `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`;
      addSuggestion({
        title: suggestion,
        url: suggestionUrl,
        source: 'search',
        query: suggestion
      });
      if (matches.length >= 5) {
        return matches.slice(0, 5);
      }
    }
  }
  if (matches.length < 5) {
    const raw = query.trim();
    const directUrl = raw.includes('://') ? raw : `https://${raw}`;
    addSuggestion({
      title: directUrl,
      url: directUrl,
      source: 'history'
    });
    if (matches.length < 5 && !raw.includes('://')) {
      addSuggestion({
        title: raw,
        url: `https://www.google.com/search?q=${encodeURIComponent(raw)}`,
        source: 'search',
        query: raw
      });
    }
  }
  return matches.slice(0, 5);
});

const toggleRendererFullscreen = (enabled, targetWin) => {
  const win = targetWin || mainWindow;
  if (win && !win.isDestroyed()) {
    win.webContents.send('window:fullscreen-toggle', { enabled });
  }
  const ctx = win ? windowRegistry.get(win.id) : null;
  const tm = ctx?.tabManager || tabManager;
  if (tm && typeof tm.getTab === 'function' && tm.activeTabId != null) {
    const tab = tm.getTab(tm.activeTabId);
    const contents = tab?.view?.webContents;
    if (contents && !contents.isDestroyed()) {
      contents.send('window:fullscreen-toggle', { enabled });
    }
  }
};

const syncAppFullscreen = (enabled, targetWin) => {
  const win = targetWin || mainWindow;
  if (win && !win.isDestroyed()) {
    if (win.isFullScreen() !== enabled) {
      win.setFullScreen(enabled);
    }
  }
  toggleRendererFullscreen(enabled, win);
};

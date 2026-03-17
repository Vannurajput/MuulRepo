/**
 * tabManager.js
 * Handles WebContentsView lifecycle, tab bookkeeping, navigation helpers, and DevTools state.
 * Architecture: WebContentsView-based multi-tab system. Each tab is a WebContentsView added to
 * the main window's content view. This provides modern, composited rendering with proper input handling.
 */
const { BrowserWindow, WebContentsView, app, dialog, Menu, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const log = require('../logger');
const { DEFAULT_HOME, TOP_BAR_HEIGHT } = require('./constants');
const historyStore = require('./historyStore');
const { formatInput } = require('./inputFormatter');
const { showContextMenu } = require('./contextMenu/contextMenu');
const { matchShortcut } = require('./shortcuts/matcher');
const { isCmdOrCtrl } = require('./shortcuts/registry');
const { attachErrorPage } = require('./errorPageHandler');
const { handleLastTabClose } = require('./lastTabClose');

const CLOSED_TAB_STACK_LIMIT = 50;

const tabLog = (...args) => log.debug('[TabManager]', ...args);
const sanitizeFilename = (value = '') => {
  const safe = String(value || '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .trim();
  return safe || 'page';
};
const clampIndex = (value, max) => {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
};

class TabManager {
  constructor(mainWindow, onStateChange, onHistoryUpdate, launchDetachedWindow, onHtmlFullscreenChange) {
    this.mainWindow = mainWindow;
    this.onStateChange = onStateChange;
    this.onHistoryUpdate = onHistoryUpdate;
    this.launchDetachedWindow = launchDetachedWindow;
    this.onHtmlFullscreenChange = onHtmlFullscreenChange;

    this.tabs = new Map();
    this.activeTabId = null;
    this.nextTabId = 1;
    this.topOffset = TOP_BAR_HEIGHT;
    this.rightInset = 0;
    this.devToolsPinned = false;
    this.closedTabs = [];
    this.sessionTabs = [];
    this.currentZoom = 1;
  }

  getTab(tabId) {
    return this.tabs.get(tabId) || null;
  }

  get activeTab() {
    return this.getTab(this.activeTabId);
  }

  getTabOrder() {
    return Array.from(this.tabs.keys());
  }

  // Open a fresh tab and navigate to the given URL (used by context menu actions).
  openInNewTab(url = DEFAULT_HOME) {
    const newTabId = this.createTab(url);
    if (newTabId != null) {
      this.setActiveTab(newTabId);
    }
    return newTabId;
  }

  createInitialTab(url = DEFAULT_HOME) {
    return this.createTab(url);
  }

  createTab(initialUrl = DEFAULT_HOME) {
    if (!this.mainWindow) {
      return null;
    }

    const tabId = this.nextTabId++;

    // Create the WebContentsView for this tab
    const view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, '../preload/contentPreload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundColor: '#f0f2f5',
        sandbox: true
      }
    });

    // Align user agent with the main window to avoid site blocks on Electron UA.
    try {
      const ua = this.mainWindow?.webContents?.getUserAgent?.();
      if (ua) {
        view.webContents.setUserAgent(ua);
      }
    } catch (_) {
      // best effort
    }

    attachErrorPage(view.webContents);

    const tab = {
      id: tabId,
      view,
      title: 'New Tab',
      url: '',
      isPinned: false,
      faviconUrl: ''
    };

    this.tabs.set(tabId, tab);
    tabLog('Created tab', tabId);
    this.registerViewListeners(tab);

    // Attach a Chrome-like context menu per tab.
    view.webContents.on('context-menu', (event, params) => {
      showContextMenu({
        mainWindow: this.mainWindow,
        tabManager: this,
        tabId,
        webContents: view.webContents,
        params
      });
    });

    if (initialUrl) {
      view.webContents.loadURL(formatInput(initialUrl));
    }

    this.setActiveTab(tabId);
    // Autofocus the top address bar when a new blank tab is created.
    try {
      this.mainWindow.webContents.send('shortcuts:focus-address', { selectAll: true });
    } catch (_) {
      // best effort
    }
    return tabId;
  }

  destroyTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      return;
    }

    if (this.activeTabId === tabId) {
      this.detachCurrentView();
    }

    this.rememberClosedTab(tab);

    // Clean up the WebContentsView
    const contents = tab.view?.webContents;
    if (contents && !contents.isDestroyed()) {
      if (contents.isDevToolsOpened()) contents.closeDevTools();
      contents.removeAllListeners();
    }
    if (tab.view && typeof tab.view.destroy === 'function') {
      tab.view.destroy();
    }

    this.tabs.delete(tabId);
    tabLog('Destroyed tab', tabId);

    if (this.tabs.size === 0) {
      handleLastTabClose(this.mainWindow);
      return;
    }

    if (this.activeTabId === tabId) {
      const fallbackTab = Array.from(this.tabs.values()).pop();
      this.setActiveTab(fallbackTab.id);
    } else {
      this.broadcastState();
    }
  }

  /** Tear down all tabs and release references (called when the owning window closes). */
  destroy() {
    for (const tabId of Array.from(this.tabs.keys())) {
      try {
        const tab = this.tabs.get(tabId);
        if (this.activeTabId === tabId) {
          this.detachCurrentView();
        }
        const contents = tab?.view?.webContents;
        if (contents && !contents.isDestroyed()) {
          contents.removeAllListeners();
        }
        this.tabs.delete(tabId);
      } catch (_) { /* best effort */ }
    }
    this.mainWindow = null;
    this.onStateChange = null;
    this.onHistoryUpdate = null;
    this.launchDetachedWindow = null;
    this.onHtmlFullscreenChange = null;
    tabLog('TabManager destroyed');
  }

  setActiveTab(tabId) {
    if (!this.tabs.has(tabId)) {
      return;
    }

    // Close DevTools on the previous tab so it doesn't affect the new tab's layout
    const prevTab = this.tabs.get(this.activeTabId);
    if (prevTab?.view?.webContents && !prevTab.view.webContents.isDestroyed()
      && prevTab.view.webContents.isDevToolsOpened()) {
      prevTab.view.webContents.closeDevTools();
    }

    this.detachCurrentView();
    this.activeTabId = tabId;
    this.attachTabView(this.tabs.get(tabId));
    if (this.devToolsPinned) {
      this.openDevTools();
    }
    this.broadcastState();
    tabLog('Activated tab', tabId);
  }

  resizeActiveView() {
    const activeTab = this.tabs.get(this.activeTabId);
    if (!this.mainWindow || !activeTab) {
      return;
    }

    const [width, height] = this.mainWindow.getContentSize();
    activeTab.view.setBounds({
      x: 0,
      y: this.topOffset,
      width: Math.max(0, width - this.rightInset),
      height: Math.max(0, height - this.topOffset)
    });
  }

  updateTopOffset(height) {
    if (typeof height === 'number' && height >= 0 && height !== this.topOffset) {
      this.topOffset = height;
      this.resizeActiveView();
      tabLog('Top offset updated', height);
    }
  }

  updateRightInset(pixels) {
    const next = Math.max(0, Number(pixels) || 0);
    if (next === this.rightInset) return;
    this.rightInset = next;
    this.resizeActiveView();
    tabLog('Right inset updated', next);
  }

  navigateActiveTab(input) {
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) {
      return;
    }
    const target = formatInput(input || tab.url);
    tab.view.webContents.loadURL(target);
    tabLog('Navigating tab', this.activeTabId, target);
  }

  triggerFindInPage() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    this.mainWindow.webContents.send('shortcuts:find-in-page');
  }

  findInPage(text) {
    const tab = this.tabs.get(this.activeTabId);
    const wc = tab?.view?.webContents;
    if (!wc || wc.isDestroyed() || !text) return;
    wc.findInPage(text);
  }

  stopFindInPage() {
    const tab = this.tabs.get(this.activeTabId);
    const wc = tab?.view?.webContents;
    if (!wc || wc.isDestroyed()) return;
    wc.stopFindInPage('clearSelection');
  }

  cycleTab(delta = 1) {
    const order = this.getTabOrder();
    const len = order.length;
    if (len < 2) return;
    const currentIndex = order.indexOf(this.activeTabId);
    const nextIndex = ((currentIndex >= 0 ? currentIndex : 0) + delta + len) % len;
    const nextId = order[nextIndex];
    if (nextId != null) {
      this.setActiveTab(nextId);
    }
  }

  goBack() {
    const tab = this.tabs.get(this.activeTabId);
    if (tab && tab.view.webContents.navigationHistory.canGoBack()) {
      tab.view.webContents.goBack();
      tabLog('Go back', this.activeTabId);
    }
  }

  goForward() {
    const tab = this.tabs.get(this.activeTabId);
    if (tab && tab.view.webContents.navigationHistory.canGoForward()) {
      tab.view.webContents.goForward();
      tabLog('Go forward', this.activeTabId);
    }
  }

  reload() {
    const tab = this.tabs.get(this.activeTabId);
    if (tab) {
      tab.view.webContents.reload();
      tabLog('Reload tab', this.activeTabId);
    }
  }

  reloadIgnoringCache() {
    const tab = this.tabs.get(this.activeTabId);
    if (tab) {
      tab.view.webContents.reloadIgnoringCache();
      tabLog('Hard reload tab', this.activeTabId);
    }
  }

  async saveActivePage() {
    const tab = this.tabs.get(this.activeTabId);
    const wc = tab?.view?.webContents;
    if (!wc || wc.isDestroyed()) return;
    const url = tab.url || wc.getURL();
    const defaultName = sanitizeFilename(tab.title || url || 'page');
    const defaultPath = app
      ? path.join(app.getPath('downloads'), `${defaultName}.html`)
      : `${defaultName}.html`;
    try {
      const result = await dialog.showSaveDialog(this.mainWindow, {
        defaultPath,
        filters: [
          { name: 'Web Page, Complete', extensions: ['html', 'htm'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      if (result.canceled || !result.filePath) {
        return;
      }
      await wc.savePage(result.filePath, 'HTMLComplete');
      tabLog('Saved page', result.filePath);
    } catch (error) {
      log.warn('Failed to save page', error);
    }
  }

  viewSourceActive() {
    const tab = this.tabs.get(this.activeTabId);
    const wc = tab?.view?.webContents;
    if (!wc || wc.isDestroyed()) return;
    try {
      wc.viewSource();
    } catch (error) {
      log.warn('Failed to open view-source', error);
    }
  }

  goHome() {
    if (!DEFAULT_HOME) return;
    this.navigateActiveTab(DEFAULT_HOME);
  }

  detachTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      return;
    }

    const targetUrl = tab.url || DEFAULT_HOME;
    const wasActive = this.activeTabId === tabId;

    if (wasActive) {
      this.detachCurrentView();
    }

    const view = tab.view;
    const contents = view?.webContents;
    if (contents && !contents.isDestroyed()) {
      contents.removeAllListeners();
    }

    this.tabs.delete(tabId);

    if (this.tabs.size === 0) {
      this.createTab(DEFAULT_HOME);
    } else if (wasActive) {
      const fallbackTab = Array.from(this.tabs.values()).pop();
      this.setActiveTab(fallbackTab.id);
    } else {
      this.broadcastState();
    }

    if (view && typeof view.destroy === 'function') {
      view.destroy();
    }

    if (typeof this.launchDetachedWindow === 'function') {
      this.launchDetachedWindow(targetUrl);
    }
  }

  labelDevToolsInstance(targetWebContents, title = 'DevTools') {
    const devTools = targetWebContents?.devToolsWebContents;
    if (devTools && !devTools.isDestroyed()) {
      devTools.executeJavaScript(`document.title = ${JSON.stringify(title)};`).catch(() => {});
    }
  }

  openDevTools() {
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) {
      return;
    }
    const { webContents } = tab.view;
    if (!webContents || webContents.isDestroyed()) {
      return;
    }
    if (!webContents.isDevToolsOpened()) {
      webContents.openDevTools({ mode: 'bottom' });
      // this.devToolsPinned = true;  // Disabled: prevents auto-opening on new tabs
      this.labelDevToolsInstance(webContents, 'Tab DevTools');
      tabLog('DevTools opened', this.activeTabId);
    }
  }

  toggleDevTools() {
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) {
      return;
    }
    const { webContents } = tab.view;
    if (!webContents) {
      return;
    }
    if (webContents.isDevToolsOpened()) {
      webContents.closeDevTools();
      // this.devToolsPinned = false;  // Disabled: prevents auto-opening on new tabs
      tabLog('DevTools closed', this.activeTabId);
    } else {
      webContents.openDevTools({ mode: 'bottom' });
      // this.devToolsPinned = true;  // Disabled: prevents auto-opening on new tabs
      this.labelDevToolsInstance(webContents, 'Tab DevTools');
      tabLog('DevTools opened', this.activeTabId);
    }
  }

  registerViewListeners(tab) {
    const { webContents } = tab.view;
    const updateFromView = () => this.broadcastState();
    const syncUrlFromWebContents = (maybeUrl) => {
      const nextUrl = maybeUrl || webContents.getURL?.() || '';
      if (nextUrl && nextUrl !== tab.url) {
        tab.url = nextUrl;
      }
      this.broadcastState();
    };
    const syncFaviconFromEvent = (favicons) => {
      if (!Array.isArray(favicons) || favicons.length === 0) return;
      const next = String(favicons[0] || '').trim();
      if (!next) return;
      if (next !== tab.faviconUrl) {
        tab.faviconUrl = next;
        this.broadcastState();
      }
    };

    const applyZoomLimits = () => {
      try {
        webContents.setVisualZoomLevelLimits(1, 5);
        webContents.setLayoutZoomLevelLimits(0, Infinity);
      } catch (_) {
        // best effort
      }
    };

    // Allow pinch-to-zoom via touchpad for better UX. Re-apply on navigation
    // because some pages reset zoom limits.
    applyZoomLimits();

    // Show zoom meter when user zooms via mouse wheel (Ctrl+scroll).
    // Read the factor after a short delay so Chromium finishes applying the zoom.
    webContents.on('zoom-changed', () => {
      setTimeout(() => {
        if (webContents.isDestroyed()) return;
        const factor = webContents.getZoomFactor();
        this.currentZoom = factor;
        this.emitZoomFactor(factor);
      }, 50);
    });

    // Route any window.open / target="_blank" into a new tab instead of a popup window.
    if (webContents.setWindowOpenHandler) {
      webContents.setWindowOpenHandler(({ url }) => {
        if (url && /^https?:/i.test(url)) {
          this.createTab(url);
        }
        return { action: 'deny' };
      });
    }

    webContents.on('render-process-gone', (_event, details) => {
      tabLog('Renderer crashed for tab', tab.id, details?.reason);
      try { if (!webContents.isDestroyed()) webContents.reload(); } catch (_) { /* best effort */ }
    });

    webContents.on('did-start-loading', updateFromView);
    webContents.on('did-stop-loading', () => {
      // Some navigations (notably search flows) can leave tab.url stale;
      // always sync from the authoritative webContents URL when loading stops.
      syncUrlFromWebContents();
      this.recordHistory(tab);
    });
    webContents.on('page-title-updated', (_, title) => {
      tab.title = title;
      this.broadcastState();
    });
    webContents.on('page-favicon-updated', (_event, favicons) => {
      syncFaviconFromEvent(favicons);
    });
    // Keep tab.url in sync for redirects and SPA navigations.
    webContents.on('will-navigate', (_event, url) => syncUrlFromWebContents(url));
    webContents.on('did-start-navigation', (_event, url, _isInPlace, isMainFrame) => {
      if (isMainFrame) {
        tab.faviconUrl = '';
        syncUrlFromWebContents(url);
      }
    });
    webContents.on('did-redirect-navigation', (_event, url) => syncUrlFromWebContents(url));
    webContents.on('did-navigate', (_, url) => {
      tab.url = url;
      tab.faviconUrl = '';
      applyZoomLimits();
      this.broadcastState();
    });
    webContents.on('did-navigate-in-page', (_, url) => {
      tab.url = url;
      applyZoomLimits();
      this.broadcastState();
    });
    webContents.on('dom-ready', () => syncUrlFromWebContents());
    webContents.on('did-fail-load', (_, __, ___, validatedURL) => {
      if (validatedURL) {
        syncUrlFromWebContents(validatedURL);
      }
    });
    webContents.on('context-menu', (event) => {
      event.preventDefault();
    });

    webContents.on('devtools-opened', () => {
      // this.devToolsPinned = true;  // Disabled: prevents auto-opening on new tabs
      this.labelDevToolsInstance(webContents, 'Tab DevTools');
      const dtWc = webContents.devToolsWebContents;
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
    webContents.on('devtools-closed', () => {
      // this.devToolsPinned = false;  // Disabled: prevents auto-opening on new tabs
    });

    // Route ALL shortcuts through the shared matcher so every shortcut works
    // even when focus is inside a tab's webview (pages can't hijack them).
    webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;

      const handler = matchShortcut(input);
      if (handler) {
        event.preventDefault();
        handler.action(this.mainWindow, this, {
          shift: input.shift,
          code: input.code,
          alt: input.alt,
          ctrlOrCmd: isCmdOrCtrl(input),
          launchNewInstance: () => this.launchDetachedWindow?.(DEFAULT_HOME),
          emitRendererShortcut: (channel, payload) => {
            if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
            this.mainWindow.webContents.send(channel, payload);
          }
        });
      }

      // Fallback: Chromium may handle zoom shortcuts (Ctrl+=/-, Ctrl+0) at a
      // lower level before matchShortcut can intercept them.  After any Ctrl
      // keypress, check whether the zoom factor actually changed and emit it
      // so the zoom meter always appears.
      if (isCmdOrCtrl(input)) {
        setTimeout(() => {
          if (webContents.isDestroyed()) return;
          const factor = webContents.getZoomFactor();
          if (Math.abs(factor - this.currentZoom) > 0.001) {
            this.currentZoom = factor;
            this.emitZoomFactor(factor);
          }
        }, 100);
      }
    });

    const emitFullscreenChange = (enabled) => {
      if (typeof this.onHtmlFullscreenChange === 'function') {
        this.onHtmlFullscreenChange(enabled);
      }
    };
    webContents.on('enter-html-full-screen', () => emitFullscreenChange(true));
    webContents.on('leave-html-full-screen', () => emitFullscreenChange(false));
  }

  recordHistory(tab) {
    if (!tab || !tab.url || tab.url === 'about:blank') {
      return;
    }
    const title = tab.view.webContents.getTitle() || tab.title || tab.url;
    historyStore.addEntry({
      title,
      url: tab.url,
      timestamp: Date.now()
    });
    this.emitHistoryUpdate();
    tabLog('Recorded history', tab.url);
  }

  emitHistoryUpdate() {
    const entries = historyStore.getHistory();
    if (typeof this.onHistoryUpdate === 'function') {
      this.onHistoryUpdate(entries);
      return;
    }

    if (this.mainWindow) {
      this.mainWindow.webContents.send('history:update', entries);
    }
  }

  attachTabView(tab) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    // Add the tab's WebContentsView to the main window's content view
    this.mainWindow.contentView.addChildView(tab.view);
    this.resizeActiveView();

    // Avoid stealing focus when the tab is blank so typing can go to the address bar.
    if (tab.url && tab.url !== 'about:blank') {
      tab.view.webContents.focus();
    } else {
      // For blank tabs, keep focus on the chrome so address bar and shortcuts work
      this.mainWindow.focus();
      this.mainWindow.webContents.focus();
    }
  }

  detachCurrentView() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const activeTab = this.tabs.get(this.activeTabId);
    if (activeTab && activeTab.view) {
      try { this.mainWindow.contentView.removeChildView(activeTab.view); } catch (_) { /* best effort */ }
    }
  }

  broadcastState() {
    if (!this.onStateChange) {
      return;
    }

    const tabsPayload = Array.from(this.tabs.values())
      .map((tab) => {
        if (!tab) return null;
        const wc = tab.view?.webContents;
        return {
          id: tab.id,
          title: tab.title || 'New Tab',
          url: tab.url || wc?.getURL?.() || '',
          faviconUrl: tab.faviconUrl || '',
          isLoading: !!wc?.isLoading?.(),
          isPinned: !!tab.isPinned
        };
      })
      .filter(Boolean);

    const activeTab = this.tabs.get(this.activeTabId);
    const activeWc = activeTab?.view?.webContents;
    const navigation = (activeTab && activeWc && !activeWc.isDestroyed())
      ? {
          url: activeTab.url || activeWc.getURL?.() || '',
          canGoBack: !!activeWc.navigationHistory?.canGoBack?.(),
          canGoForward: !!activeWc.navigationHistory?.canGoForward?.()
        }
      : { url: '', canGoBack: false, canGoForward: false };

    this.onStateChange({
      tabs: tabsPayload,
      activeTabId: this.activeTabId,
      navigation
    });
  }

  setPinned(tabId, pinned = true) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    tab.isPinned = !!pinned;
    tabLog('Set pin', tabId, '->', tab.isPinned);
    this.broadcastState();
  }

  togglePin(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    tab.isPinned = !tab.isPinned;
    tabLog('Toggled pin', tabId, '->', tab.isPinned);
    this.broadcastState();
  }

  reloadTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.view.webContents.reload();
      tabLog('Reload tab', tabId);
    }
  }

  duplicateTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;
    const url = tab.url || tab.view.webContents.getURL() || DEFAULT_HOME;
    return this.createTab(url);
  }

  closeOtherTabs(tabId) {
    if (!this.tabs.has(tabId)) return;

    const idsToClose = [];
    for (const [id, t] of this.tabs.entries()) {
      if (id !== tabId && !t.isPinned) {
        idsToClose.push(id);
      }
    }
    idsToClose.forEach((id) => this.destroyTab(id));

    if (this.tabs.has(tabId)) {
      this.setActiveTab(tabId);
    } else if (this.tabs.size) {
      this.setActiveTab(Array.from(this.tabs.values())[0].id);
    }
  }

  closeTabsToRight(tabId) {
    const order = this.getTabOrder();
    const idx = order.indexOf(tabId);
    if (idx === -1) return;

    const idsToRight = order.slice(idx + 1);
    idsToRight.forEach((id) => {
      const t = this.tabs.get(id);
      if (t && !t.isPinned) {
        this.destroyTab(id);
      }
    });

    if (this.tabs.has(tabId)) {
      this.setActiveTab(tabId);
    } else if (this.tabs.size) {
      this.setActiveTab(Array.from(this.tabs.values())[0].id);
    }
  }

  printActive() {
    const tab = this.tabs.get(this.activeTabId);
    const wc = tab?.view?.webContents;
    if (!wc || wc.isDestroyed()) return;
    wc.print({ printBackground: true }, () => {});
  }

  getActiveZoom() {
    const tab = this.tabs.get(this.activeTabId);
    const wc = tab?.view?.webContents;
    if (!wc || wc.isDestroyed()) return 1;
    return wc.getZoomFactor();
  }

  setActiveZoom(factor) {
    const tab = this.tabs.get(this.activeTabId);
    const wc = tab?.view?.webContents;
    if (!wc || wc.isDestroyed()) return;
    const clamped = Math.max(0.25, Math.min(5, factor));
    wc.setZoomFactor(clamped);
    this.currentZoom = clamped;
    this.emitZoomFactor(clamped);
    // Re-emit after a tick so the renderer always receives the update,
    // even when called from inside a before-input-event handler where
    // synchronous IPC can be batched by Electron.
    setTimeout(() => this.emitZoomFactor(clamped), 60);
  }

  nudgeActiveZoom(direction = 1) {
    const current = this.getActiveZoom();
    const next = current + 0.1 * (direction >= 0 ? 1 : -1);
    this.setActiveZoom(next);
  }

  moveTab(tabId, beforeTabId) {
    const dragged = this.tabs.get(tabId);
    if (!dragged) return;
    if (beforeTabId === tabId) return;

    const target = beforeTabId ? this.tabs.get(beforeTabId) : null;
    // Do not mix pinned/unpinned groups
    if (target && dragged.isPinned !== target.isPinned) return;

    const pinnedOrder = [];
    const unpinnedOrder = [];
    for (const id of this.tabs.keys()) {
      const t = this.tabs.get(id);
      if (!t) continue;
      if (t.isPinned) pinnedOrder.push(id);
      else unpinnedOrder.push(id);
    }

    const reorderWithin = (list, moveId, beforeId) => {
      const from = list.indexOf(moveId);
      if (from === -1) return list;
      list.splice(from, 1);
      if (beforeId && list.includes(beforeId)) {
        const idx = list.indexOf(beforeId);
        list.splice(idx, 0, moveId);
      } else {
        list.push(moveId);
      }
      return list;
    };

    if (dragged.isPinned) {
      reorderWithin(pinnedOrder, tabId, beforeTabId);
    } else {
      reorderWithin(unpinnedOrder, tabId, beforeTabId);
    }

    const merged = [...pinnedOrder, ...unpinnedOrder];
    const newTabs = new Map();
    merged.forEach((id) => {
      const t = this.tabs.get(id);
      if (t) newTabs.set(id, t);
    });
    this.tabs = newTabs;
    if (!this.tabs.has(this.activeTabId) && this.tabs.size) {
      this.activeTabId = Array.from(this.tabs.keys())[0];
    }
    this.broadcastState();
  }

  resetZoom() {
    this.setActiveZoom(1);
  }

  emitZoomFactor(value) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    const payload = typeof value === 'number' ? value : this.currentZoom;
    this.mainWindow.webContents.send('tabs:zoom-factor', { factor: payload });
  }

  getTabIdByIndex(index) {
    const order = this.getTabOrder();
    if (!order.length) return null;
    const clamped = clampIndex(index, order.length - 1);
    return order[clamped] ?? null;
  }

  getLastTabId() {
    const order = this.getTabOrder();
    if (!order.length) return null;
    return order[order.length - 1];
  }

  activateNextTab() {
    const order = this.getTabOrder();
    if (!order.length) return;
    const currentIndex = order.indexOf(this.activeTabId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % order.length;
    this.setActiveTab(order[nextIndex]);
  }

  activatePreviousTab() {
    const order = this.getTabOrder();
    if (!order.length) return;
    const currentIndex = order.indexOf(this.activeTabId);
    const prevIndex =
      currentIndex === -1 ? 0 : (currentIndex - 1 + order.length) % order.length;
    this.setActiveTab(order[prevIndex]);
  }

  rememberClosedTab(tab) {
    if (!tab) return;
    let url = tab.url || tab.view?.webContents?.getURL?.() || '';
    if (!url || url === 'about:blank') {
      url = DEFAULT_HOME;
    }
    const title = tab.title || (url === DEFAULT_HOME ? 'New Tab' : url);
    this.closedTabs.unshift({ url, title });
    if (this.closedTabs.length > CLOSED_TAB_STACK_LIMIT) {
      this.closedTabs.pop();
    }
  }

  reopenLastClosed() {
    // If there are session tabs from a previous session, restore ALL at once
    if (this.sessionTabs.length) {
      let lastTabId = null;
      for (const entry of this.sessionTabs) {
        if (!entry?.url) continue;
        const tabId = this.createTab(entry.url);
        const tab = this.tabs.get(tabId);
        if (tab && entry.title) {
          tab.title = entry.title;
        }
        lastTabId = tabId;
      }
      this.sessionTabs = [];
      this.broadcastState();
      return lastTabId;
    }

    // Otherwise reopen individual closed tabs one at a time
    if (!this.closedTabs.length) {
      return null;
    }
    const payload = this.closedTabs.shift();
    if (!payload?.url) {
      return null;
    }
    const tabId = this.createTab(payload.url);
    const tab = this.tabs.get(tabId);
    if (tab && payload.title) {
      tab.title = payload.title;
      this.broadcastState();
    }
    return tabId;
  }

  static get sessionFilePath() {
    return path.join(app.getPath('userData'), 'session.json');
  }

  saveSession() {
    const tabs = [];
    for (const tab of this.tabs.values()) {
      try {
        const wc = tab.view?.webContents;
        const url = tab.url || (wc && !wc.isDestroyed() ? wc.getURL?.() : '') || '';
        if (!url || url === 'about:blank') continue;
        tabs.push({ url, title: tab.title || 'Tab' });
      } catch (_) { /* skip destroyed tab */ }
    }
    try {
      fs.writeFileSync(TabManager.sessionFilePath, JSON.stringify(tabs), 'utf8');
      tabLog('Session saved', tabs.length, 'tab(s)');
    } catch (err) {
      tabLog('Failed to save session', err.message);
    }
  }

  loadSession() {
    try {
      const raw = fs.readFileSync(TabManager.sessionFilePath, 'utf8');
      const tabs = JSON.parse(raw);
      if (!Array.isArray(tabs) || !tabs.length) return;
      // Store as session group — all restored at once with one Ctrl+Shift+T
      for (const entry of tabs) {
        if (entry?.url && entry.url !== 'about:blank') {
          this.sessionTabs.push({ url: entry.url, title: entry.title || 'Tab' });
        }
      }
      tabLog('Session loaded', this.sessionTabs.length, 'tab(s) available for restore');
      // Clear the file so stale sessions aren't restored again
      fs.writeFileSync(TabManager.sessionFilePath, '[]', 'utf8');
    } catch {
      // No session file or invalid — ignore
    }
  }
}

module.exports = TabManager;

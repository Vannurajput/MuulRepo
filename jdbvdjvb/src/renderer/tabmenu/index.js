// Uses bridges exposed in preload.js: tabMenuBridge + browserBridge

let current = { tabId: null, isPinned: false };

const bySel = (sel) => document.querySelector(sel);
const pinBtn = bySel('[data-action="pin"]');
const card   = bySel('.tm-card');

function setPinLabel() {
  const label = pinBtn?.querySelector('.tm-label');
  if (label) label.textContent = current.isPinned ? 'Unpin tab' : 'Pin tab';
}

function wireHandlers() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') tabMenuBridge.close();
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tm-item');
    if (!btn) return;

    const act = btn.dataset.action;
    const id = current.tabId;
    if (id == null) return;

    (async () => {
      try {
        if (act === 'pin') {
          await browserBridge.pinTab(id);
        } else if (act === 'close') {
          await browserBridge.closeTab(id);
        } else if (act === 'closeOthers') {
          await browserBridge.closeOtherTabs(id);
        } else if (act === 'closeRight') {
          await browserBridge.closeTabsToRight(id);
        } else if (act === 'newTabRight') {
          await browserBridge.createTab();
        } else if (act === 'reload') {
          await browserBridge.reloadTab(id);
        } else if (act === 'duplicate') {
          await browserBridge.duplicateTab(id);
        } else if (act === 'moveToWindow') {
          await browserBridge.moveTabToWindow(id);
        }
      } finally {
        tabMenuBridge.close();
      }
    })();
  });

  // prevent native context menu inside popup
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

function init() {
  wireHandlers();

  // Receive payload from main: { tabId, isPinned, theme }
  tabMenuBridge.onOpen((payload) => {
    current.tabId = payload?.tabId ?? null;
    current.isPinned = !!payload?.isPinned;
    // Apply theme from main window
    if (payload?.theme) {
      document.documentElement.setAttribute('data-theme', payload.theme);
    }
    setPinLabel();
    // focus first button for keyboard
    const firstBtn = card?.querySelector('.tm-item');
    firstBtn?.focus?.();
  });
}

init();

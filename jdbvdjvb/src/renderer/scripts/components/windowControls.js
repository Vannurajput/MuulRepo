// src/renderer/scripts/components/windowControls.js
// Native titleBarOverlay handles minimize/maximize/close on Windows.
// This module only listens for window-state changes so other UI
// (e.g. snapLayout, fullscreen toggle) can react to maximize events.

const initWindowControls = () => {
  if (!window.browserBridge) return;

  // Keep state listener alive — snapLayout.js and other modules rely on
  // window:state broadcasts for maximize / fullscreen awareness.
  window.browserBridge.onWindowState?.(() => { /* handled by snapLayout */ });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWindowControls, { once: true });
} else {
  initWindowControls();
}

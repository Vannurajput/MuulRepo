/**
 * snapLayout.js
 * Receives snap state from the main process and applies CSS classes
 * to <html> so responsive.css can style the UI for every snap size.
 *
 * Classes applied:
 *   .snap-compact   — quarter screen / very narrow  (<640 px)
 *   .snap-narrow    — half screen                   (640–1024 px)
 *   .snap-medium    — two-thirds screen             (1024–1280 px)
 *   .snap-full      — full width                    (>1280 px)
 *   .is-maximized   — window is in maximized state (needs padding fix)
 */

const SIZE_CLASSES = ['snap-compact', 'snap-narrow', 'snap-medium', 'snap-full'];

function initSnapLayout() {
  if (!window.browserBridge?.onSnapState) return;

  const root = document.documentElement;

  window.browserBridge.onSnapState((state) => {
    const { sizeClass, isMaximized } = state;

    // Update size class
    const newClass = 'snap-' + sizeClass;
    SIZE_CLASSES.forEach((cls) => {
      if (cls === newClass) {
        root.classList.add(cls);
      } else {
        root.classList.remove(cls);
      }
    });

    // Update maximized flag
    if (isMaximized) {
      root.classList.add('is-maximized');
    } else {
      root.classList.remove('is-maximized');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSnapLayout, { once: true });
} else {
  initSnapLayout();
}

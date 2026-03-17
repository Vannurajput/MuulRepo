/**
 * zoomIndicator.js
 * Chrome-style zoom popup that appears when the user zooms in/out.
 * Shows current zoom %, minus/plus buttons, and a Reset button.
 * Auto-hides after a few seconds of inactivity.
 */

const AUTO_HIDE_MS = 1500;

export const initZoomIndicator = () => {
  const container = document.getElementById('zoomIndicator');
  if (!container) return;

  const percentEl = container.querySelector('.zoom-percent');
  const minusBtn = container.querySelector('.zoom-minus');
  const plusBtn = container.querySelector('.zoom-plus');
  const resetBtn = container.querySelector('.zoom-reset');

  let hideTimer = null;
  let currentFactor = 1;

  const show = (factor) => {
    currentFactor = factor;
    const pct = Math.round(factor * 100);
    if (percentEl) percentEl.textContent = `${pct}%`;

    // Show/hide reset based on whether zoom is at 100%
    if (resetBtn) {
      resetBtn.style.display = pct === 100 ? 'none' : '';
    }

    container.classList.add('visible');
    scheduleHide();
  };

  const hide = () => {
    container.classList.remove('visible');
    clearTimeout(hideTimer);
  };

  const scheduleHide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, AUTO_HIDE_MS);
  };

  // Button handlers
  minusBtn?.addEventListener('click', () => {
    window.browserBridge?.zoomBridge?.out?.();
    scheduleHide();
  });

  plusBtn?.addEventListener('click', () => {
    window.browserBridge?.zoomBridge?.in?.();
    scheduleHide();
  });

  resetBtn?.addEventListener('click', () => {
    window.browserBridge?.zoomBridge?.reset?.();
    scheduleHide();
  });

  // Listen for zoom changes from main process
  window.browserBridge?.onZoomFactor?.((payload = {}) => {
    if (typeof payload?.factor === 'number') {
      show(payload.factor);
    }
  });

  return { show, hide };
};

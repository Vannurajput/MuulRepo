/**
 * addressAutocomplete.js
 * Chrome-style inline auto-complete for address bars.
 *
 * When the user types in an address bar, this module looks at the suggestion
 * results and fills the best matching URL directly into the input field.
 * The auto-completed portion is highlighted (selected) so the next keystroke
 * replaces it naturally.
 *
 * Example: user types "y" → input shows "youtube.com" with "outube.com" selected.
 *          Pressing Enter navigates to youtube.com.
 *          Typing another letter replaces the selection.
 */

/**
 * Strip a URL down to its bare domain + path for matching and display.
 *   "https://www.youtube.com/watch?v=abc" → "youtube.com/watch?v=abc"
 *   "http://example.org"                 → "example.org"
 */
const stripUrl = (raw) => {
  try {
    const u = new URL(raw);
    let host = u.hostname.replace(/^www\./, '');
    const rest = u.pathname === '/' ? '' : u.pathname;
    return host + rest;
  } catch {
    return raw.replace(/^https?:\/\/(www\.)?/, '');
  }
};

/**
 * Find the best auto-complete candidate from a list of suggestion items.
 * The candidate must start with what the user typed (after stripping protocol/www).
 * Returns { display, fullUrl } or null.
 */
const findBestMatch = (typed, items) => {
  if (!typed || !items?.length) return null;

  const lower = typed.toLowerCase();

  for (const item of items) {
    if (!item.url || item.source === 'search') continue;

    const stripped = stripUrl(item.url);
    if (stripped.toLowerCase().startsWith(lower)) {
      return { display: stripped, fullUrl: item.url };
    }

    // Also try matching just the hostname
    const host = stripped.split('/')[0];
    if (host.toLowerCase().startsWith(lower)) {
      return { display: stripped, fullUrl: item.url };
    }
  }

  return null;
};

/**
 * Attach inline auto-complete behavior to an address bar input element.
 *
 * @param {HTMLInputElement} input - The address bar input.
 * @param {Function} getSuggestions - Async function(query) that returns suggestion items.
 */
export const initAddressAutocomplete = (input, getSuggestions) => {
  if (!input || typeof getSuggestions !== 'function') return;

  let lastUserTyped = '';
  let isAutocompleted = false;
  let debounceId = null;

  const applyAutocomplete = async (typed) => {
    if (!typed) {
      isAutocompleted = false;
      return;
    }

    // Don't auto-complete if user typed a space (likely a search query)
    if (typed.includes(' ')) {
      isAutocompleted = false;
      return;
    }

    try {
      const items = await getSuggestions(typed);
      // If the user kept typing while we fetched, ignore stale results
      if (lastUserTyped !== typed) return;

      const match = findBestMatch(typed, items);
      if (!match) {
        isAutocompleted = false;
        return;
      }

      // Fill in the full URL and select the auto-completed portion
      input.value = match.display;
      input.setSelectionRange(typed.length, match.display.length);
      isAutocompleted = true;
    } catch {
      isAutocompleted = false;
    }
  };

  input.addEventListener('input', (e) => {
    // Only auto-complete on regular typing (insertText), not on
    // deletions (deleteContentBackward/Forward) or paste.
    const isTyping = e.inputType === 'insertText';

    const currentValue = input.value;
    // If auto-completed text is present and user is typing,
    // the selection was already replaced by the browser — use full value up to cursor.
    const typed = isTyping
      ? currentValue.slice(0, input.selectionStart)
      : currentValue;

    lastUserTyped = typed;

    if (!isTyping) {
      isAutocompleted = false;
      return;
    }

    clearTimeout(debounceId);
    debounceId = setTimeout(() => applyAutocomplete(typed), 80);
  });

  // When user presses Delete/Backspace while auto-complete is active,
  // clear the auto-completed portion and keep only what user typed.
  input.addEventListener('keydown', (e) => {
    if (isAutocompleted && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      input.value = lastUserTyped;
      input.setSelectionRange(lastUserTyped.length, lastUserTyped.length);
      isAutocompleted = false;
    }
  });

  // Reset state when input loses focus
  input.addEventListener('blur', () => {
    isAutocompleted = false;
    lastUserTyped = '';
    clearTimeout(debounceId);
  });
};

export function initChatPanel({ bridge, toggleButton }) {
  const drawer = document.getElementById('chatDrawer');
  const closeBtn = document.getElementById('chatClose');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const messagesEl = document.getElementById('chatMessages');
  const statusEl = document.getElementById('chatStatus');

  if (!drawer || !bridge) return;

  let history = [];
  let pending = false;
  const DRAWER_WIDTH = 360;
  const log = (...args) => console.log('[ChatPanel]', ...args);

  const setOpen = (next) => {
    document.body.classList.toggle('chat-open', !!next);
  };

  const pushMessage = (role, content) => {
    if (!messagesEl) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-message ${role === 'user' ? 'me' : 'bot'}`;
    bubble.textContent = content;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    history.push({ role: role === 'user' ? 'user' : 'assistant', content });
  };

  const setPending = (state) => {
    pending = state;
    if (statusEl) statusEl.hidden = !state;
    if (input) input.disabled = state;
    if (sendBtn) sendBtn.disabled = state;
  };

  const handleToggle = async () => {
    log('handleToggle called');
    try {
      const res = await bridge.toggle();
      log('bridge.toggle response:', res);
      setOpen(res?.open);
    } catch (err) {
      console.error('[ChatPanel] toggle failed', err);
    }
  };

  toggleButton?.addEventListener('click', handleToggle);
  closeBtn?.addEventListener('click', handleToggle);

  bridge.onState?.((state) => {
    setOpen(!!state?.open);
    log('state', state);
  });

  window.addEventListener('resize', () => setOpen(document.body.classList.contains('chat-open')), { passive: true });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pending || !input) return;
    const prompt = input.value.trim();
    if (!prompt) return;
    pushMessage('user', prompt);
    input.value = '';
    setPending(true);
    try {
      const res = await bridge.ask(prompt, history);
      const reply = res?.reply || 'No response.';
      pushMessage('assistant', reply);
    } catch (err) {
      console.error('chat ask failed', err);
      pushMessage('assistant', 'Sorry, I could not reply.');
    } finally {
      setPending(false);
    }
  });

  return { toggle: handleToggle };
}

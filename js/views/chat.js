/**
 * views/chat.js – Chat list + conversation window
 */

const ChatView = (() => {
  let _activeChatId = null;   // ID of current chat partner
  let _pollTimer    = null;

  function init() {
    document.getElementById('chat-back-btn').addEventListener('click', _closeWindow);
    document.getElementById('chat-send-btn').addEventListener('click', _send);
    document.getElementById('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') _send();
    });
    document.getElementById('fab-chat').addEventListener('click', () => {
      Router.go('chat');
    });
  }

  // ---- Render chat list -------------------------------------
  function renderChatList() {
    if (!Auth.isLoggedIn()) return;
    const partners = Auth.getChatPartners();
    const list   = document.getElementById('chat-list');
    const empty  = document.getElementById('chat-list-empty');

    if (partners.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    list.innerHTML = partners.map(p => {
      const msgs    = Auth.getMessages(p.id);
      const lastMsg = msgs[msgs.length - 1];
      return `
        <div class="chat-list-item ${_activeChatId === p.id ? 'active' : ''}" data-uid="${p.id}">
          <div class="chat-list-avatar">${p.name[0].toUpperCase()}</div>
          <div class="chat-list-info">
            <div class="chat-list-name">${p.name}</div>
            <div class="chat-list-preview">${lastMsg ? lastMsg.body : 'Noch keine Nachrichten'}</div>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.chat-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const uid  = item.dataset.uid;
        const user = partners.find(p => p.id === uid);
        if (user) _openWindow(user);
      });
    });
  }

  // ---- Open window ------------------------------------------
  function _openWindow(partner) {
    _activeChatId = partner.id;

    document.getElementById('chat-partner-avatar').textContent = partner.name[0].toUpperCase();
    document.getElementById('chat-partner-name').textContent   = partner.name;

    // On mobile, hide list and show window
    const listPanel = document.getElementById('chat-list-panel');
    const window_   = document.getElementById('chat-window');
    listPanel.classList.add('hidden');
    window_.classList.remove('hidden');

    // Mark messages from this partner as read
    Auth.markRead(partner.id);
    if (typeof _updateFabBadge === 'function') _updateFabBadge();

    _renderMessages();
    _startPoll();
  }

  function _closeWindow() {
    _activeChatId = null;
    document.getElementById('chat-list-panel').classList.remove('hidden');
    document.getElementById('chat-window').classList.add('hidden');
    _stopPoll();
    renderChatList();
  }

  // ---- Public: open chat with a user (from public profile) --
  function openChatWith(partner) {
    // If there are no existing messages, send a placeholder greeting
    Router.go('chat');
    setTimeout(() => {
      _openWindow(partner);
    }, 50);
  }

  // ---- Messages ---------------------------------------------
  function _renderMessages() {
    if (!_activeChatId) return;
    const me   = Auth.getUser();
    const msgs = Auth.getMessages(_activeChatId);
    const box  = document.getElementById('chat-messages');

    box.innerHTML = msgs.map(m => {
      const sent = m.fromId === me.id;
      return `<div class="chat-msg ${sent ? 'sent' : 'received'}">${_escape(m.body)}</div>`;
    }).join('');

    box.scrollTop = box.scrollHeight;
  }

  function _send() {
    if (!_activeChatId) return;
    const input = document.getElementById('chat-input');
    const body  = input.value.trim();
    if (!body) return;

    Auth.sendMessage(_activeChatId, body);
    input.value = '';
    _renderMessages();
    renderChatList();
  }

  // Lightweight poll to pick up new messages (demo mode only)
  function _startPoll() {
    _stopPoll();
    _pollTimer = setInterval(() => {
      if (Router.current() === 'chat' && _activeChatId) _renderMessages();
    }, 2000);
  }

  function _stopPoll() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  }

  // ---- Utils ------------------------------------------------
  function _escape(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, renderChatList, openChatWith };
})();

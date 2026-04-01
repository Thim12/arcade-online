/**
 * views/social.js – Community view, user search, follow,
 *                   public profile + head-to-head
 */

const SocialView = (() => {
  let _activeTab = 'entdecken';
  let _viewingUser = null;  // currently viewed public profile

  function init() {
    _bindTabs();
    _bindSearch();
    _bindPublicProfile();
  }

  // ---- Social tabs ------------------------------------------
  function _bindTabs() {
    document.querySelectorAll('.social-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.social-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _activeTab = tab.dataset.tab;
        _renderGrid();
      });
    });
  }

  // ---- Render grid ------------------------------------------
  function renderSocial() {
    _renderGrid();
  }

  function _renderGrid(filter = '') {
    const me    = Auth.getUser();
    const grid  = document.getElementById('social-grid');
    let users   = Auth.getAllUsers();

    // Exclude self
    if (me) users = users.filter(u => u.id !== me.id);

    // Filter by tab
    if (me && _activeTab === 'following') {
      users = users.filter(u => (me.following || []).includes(u.id));
    } else if (me && _activeTab === 'follower') {
      users = users.filter(u => (me.followers || []).includes(u.id));
    }

    // Search filter
    if (filter) {
      const q = filter.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.location || '').toLowerCase().includes(q) ||
        (u.sport || '').toLowerCase().includes(q)
      );
    }

    if (users.length === 0) {
      grid.innerHTML = '<p style="color:var(--color-text-3);grid-column:1/-1;text-align:center;padding:40px 0">Keine Spieler gefunden.</p>';
      return;
    }

    grid.innerHTML = users.map(u => {
      const following = me && (me.following || []).includes(u.id);
      return `
        <div class="user-card" data-uid="${u.id}">
          <div class="user-card-avatar">${u.name[0].toUpperCase()}</div>
          <div class="user-card-name">${u.name}</div>
          <div class="user-card-sport">${sportEmoji(u.sport)} ${sportLabel(u.sport)}</div>
          <div class="user-card-loc">📍 ${u.location || 'Hessen'}</div>
          ${me ? `<button class="btn ${following ? 'btn-outline' : 'btn-primary'} btn-sm user-card-follow-btn" data-uid="${u.id}">
            ${following ? 'Entfolgen' : 'Folgen'}
          </button>` : ''}
        </div>
      `;
    }).join('');

    // Click on card body → public profile
    grid.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.user-card-follow-btn')) return;
        const uid = card.dataset.uid;
        const user = users.find(u => u.id === uid);
        if (user) _showPublicProfile(user);
      });
    });

    // Follow buttons
    grid.querySelectorAll('.user-card-follow-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!Auth.isLoggedIn()) {
          Toast.show('Bitte erst anmelden.', 'info');
          document.getElementById('auth-modal').classList.remove('hidden');
          return;
        }
        const uid = btn.dataset.uid;
        const nowFollowing = Auth.toggleFollow(uid);
        btn.textContent = nowFollowing ? 'Entfolgen' : 'Folgen';
        btn.className   = `btn ${nowFollowing ? 'btn-outline' : 'btn-primary'} btn-sm user-card-follow-btn`;
        Toast.show(nowFollowing ? 'Folgst du jetzt!' : 'Nicht mehr gefolgt.', 'success');
        Auth.addXP(nowFollowing ? 20 : 0);
      });
    });
  }

  // ---- Search -----------------------------------------------
  function _bindSearch() {
    const input = document.getElementById('social-search-input');
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => _renderGrid(input.value.trim()), 200);
    });
  }

  // ---- Public Profile View ----------------------------------
  function _showPublicProfile(user) {
    _viewingUser = user;

    document.getElementById('pub-avatar').textContent  = user.name[0].toUpperCase();
    document.getElementById('pub-name').textContent    = user.name;
    document.getElementById('pub-sport').textContent   = `${sportEmoji(user.sport)} ${sportLabel(user.sport)}`;
    document.getElementById('pub-location').textContent= `📍 ${user.location || 'Hessen'}`;

    document.getElementById('pub-followers').textContent = (user.followers || []).length;
    document.getElementById('pub-following').textContent = (user.following || []).length;
    document.getElementById('pub-matches').textContent   = user.matches || 0;

    // Follow button state
    const me     = Auth.getUser();
    const followBtn = document.getElementById('pub-follow-btn');
    if (me) {
      const following = (me.following || []).includes(user.id);
      followBtn.textContent = following ? 'Entfolgen' : 'Folgen';
      followBtn.className   = `btn ${following ? 'btn-outline' : 'btn-primary'}`;
    } else {
      followBtn.textContent = 'Folgen';
      followBtn.className   = 'btn btn-primary';
    }

    // H2H
    _renderH2H(me, user);

    Router.go('public-profile');
  }

  function _renderH2H(me, them) {
    const myWins   = me  ? (me.wins   || 0) : 0;
    const themWins = them ? (them.wins || 0) : 0;
    const total    = myWins + themWins || 1;

    document.getElementById('h2h-you').textContent   = me ? me.name.split(' ')[0] : 'Du';
    document.getElementById('h2h-them').textContent  = them.name.split(' ')[0];

    const leftPct  = Math.round((myWins   / total) * 100);
    const rightPct = 100 - leftPct;

    document.getElementById('h2h-fill-left').style.width  = leftPct  + '%';
    document.getElementById('h2h-fill-right').style.width = rightPct + '%';
    document.getElementById('h2h-score-left').textContent  = myWins;
    document.getElementById('h2h-score-right').textContent = themWins;
  }

  function _bindPublicProfile() {
    document.getElementById('public-profile-back').addEventListener('click', () => Router.go('social'));

    document.getElementById('pub-follow-btn').addEventListener('click', () => {
      if (!Auth.isLoggedIn() || !_viewingUser) {
        Toast.show('Bitte erst anmelden.', 'info');
        return;
      }
      const nowFollowing = Auth.toggleFollow(_viewingUser.id);
      const btn = document.getElementById('pub-follow-btn');
      btn.textContent = nowFollowing ? 'Entfolgen' : 'Folgen';
      btn.className   = `btn ${nowFollowing ? 'btn-outline' : 'btn-primary'}`;
      Toast.show(nowFollowing ? 'Du folgst nun ' + _viewingUser.name : 'Entfolgt.', 'success');
    });

    document.getElementById('pub-message-btn').addEventListener('click', () => {
      if (!Auth.isLoggedIn()) {
        Toast.show('Bitte erst anmelden.', 'info');
        return;
      }
      if (_viewingUser) ChatView.openChatWith(_viewingUser);
    });
  }

  return { init, renderSocial };
})();

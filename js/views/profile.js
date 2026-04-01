/**
 * views/profile.js – Own profile view: stats, charts, badges, activity, edit modal
 */

const ProfileView = (() => {
  let _perfChart    = null;
  let _actChart     = null;
  let _chartsBuilt  = false;

  function init() {
    _bindTabs();
    _bindEditModal();
    _bindAvatarEdit();
    _bindAccountActions();
    _bindGuestBtn();

    // Re-render when auth state changes
    Auth.onAuthChange(user => render(user));
  }

  // ---- Avatar edit button -----------------------------------
  function _bindAvatarEdit() {
    const btn = document.getElementById('profile-avatar-edit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      // Open profile edit modal (avatar text-based for demo, full photo upload needs backend)
      const modal = document.getElementById('profile-edit-modal');
      const u = Auth.getUser();
      if (!u) return;
      document.getElementById('edit-name').value     = u.name     || '';
      document.getElementById('edit-sport').value    = u.sport    || 'fussball';
      document.getElementById('edit-agegroup').value = u.ageGroup || '';
      document.getElementById('edit-location').value = u.location || '';
      document.getElementById('edit-bio').value      = u.bio      || '';
      modal.classList.remove('hidden');
    });
  }

  // ---- Render -----------------------------------------------
  function render(user) {
    const guest   = document.getElementById('profile-guest');
    const content = document.getElementById('profile-content');

    if (!user) {
      guest.classList.remove('hidden');
      content.classList.add('hidden');
      return;
    }

    guest.classList.add('hidden');
    content.classList.remove('hidden');

    // Avatar
    const av = document.getElementById('profile-avatar-display');
    av.textContent = user.name ? user.name[0].toUpperCase() : '?';

    // Info
    document.getElementById('profile-name-display').textContent     = user.name || '–';
    document.getElementById('profile-sport-display').textContent    = sportLabel(user.sport);
    document.getElementById('profile-location-display').textContent = user.location || 'Hessen';
    const agEl = document.getElementById('profile-agegroup-display');
    if (agEl) agEl.textContent = user.ageGroup || '';

    // Level bar
    const lvl = getLevel(user.xp || 0);
    document.getElementById('profile-level-num').textContent  = lvl.level;
    document.getElementById('profile-xp-display').textContent = `${user.xp || 0} / ${lvl.nextMin} XP`;
    document.getElementById('profile-xp-bar').style.width     = lvl.pct + '%';

    // Stats
    document.getElementById('stat-matches').textContent  = user.matches   || 0;
    document.getElementById('stat-wins').textContent     = user.wins      || 0;
    document.getElementById('stat-trainings').textContent= user.trainings || 0;
    const wr = user.matches > 0 ? Math.round((user.wins / user.matches) * 100) : 0;
    document.getElementById('stat-winrate').textContent  = wr + '%';

    // Badges
    _renderBadges(user);

    // Activity
    _renderActivity(user);

    // Charts (build once, update afterwards)
    if (!_chartsBuilt) {
      _buildCharts(user);
      _chartsBuilt = true;
    } else {
      _updateCharts(user);
    }
  }

  // ---- Badges -----------------------------------------------
  function _renderBadges(user) {
    const grid = document.getElementById('badges-grid');
    const badges = getBadges(user);
    grid.innerHTML = badges.map(b => `
      <div class="badge-item ${b.earned ? 'earned' : ''}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.desc}</div>
      </div>
    `).join('');
  }

  // ---- Activity Feed ----------------------------------------
  function _renderActivity(user) {
    const feed = document.getElementById('activity-feed');
    // Generate pseudo-activity from stats
    const items = [];

    if (user.matches > 0)   items.push({ icon: '⚽', title: `${user.matches} Spiele gespielt`, date: 'Diesen Monat' });
    if (user.wins > 0)      items.push({ icon: '🏆', title: `${user.wins} Siege erreicht`,    date: 'Diese Saison' });
    if (user.trainings > 0) items.push({ icon: '💪', title: `${user.trainings}x Training`,    date: 'Diesen Monat' });
    if (user.xp > 0)        items.push({ icon: '⭐', title: `${user.xp} XP gesammelt`,        date: 'Gesamt' });

    if (items.length === 0) {
      feed.innerHTML = '<p style="color:var(--color-text-3);font-size:.88rem">Noch keine Aktivitäten. Starte dein erstes Spiel!</p>';
      return;
    }

    feed.innerHTML = items.map(a => `
      <div class="activity-item">
        <div class="activity-icon">${a.icon}</div>
        <div class="activity-text">
          <div class="activity-title">${a.title}</div>
          <div class="activity-date">${a.date}</div>
        </div>
      </div>
    `).join('');
  }

  // ---- Charts -----------------------------------------------
  function _makePerformanceData(user) {
    // Simulate 6-month performance trend
    const base  = Math.max(1, user.matches || 10);
    const wins  = Math.max(1, user.wins    || 5);
    const ratio = wins / base;
    const months = ['Okt', 'Nov', 'Dez', 'Jan', 'Feb', 'Mär'];
    const data  = months.map((_, i) => Math.round(ratio * 100 * (0.6 + i * 0.08)));
    return { labels: months, data };
  }

  function _makeActivityData(user) {
    const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
    const base  = Math.max(1, user.trainings || 3);
    // Stable seed derived from user id to avoid random flicker on each re-render
    const seed  = (user.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 42;
    function _seeded(i) {
      const x = Math.sin(seed + i) * 10000;
      return x - Math.floor(x);
    }
    const data  = weeks.map((_, i) => Math.floor(_seeded(i) * (base / 3 + 1)));
    return { labels: weeks, data };
  }

  function _buildCharts(user) {
    const perfData = _makePerformanceData(user);
    const actData  = _makeActivityData(user);

    // Performance chart
    const ctxPerf = document.getElementById('chart-performance');
    if (ctxPerf) {
      _perfChart = new Chart(ctxPerf, {
        type: 'line',
        data: {
          labels: perfData.labels,
          datasets: [{
            label: 'Win-Rate %',
            data:  perfData.data,
            borderColor: '#0a0a0a',
            backgroundColor: 'rgba(10,10,10,.06)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#0a0a0a',
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { callback: v => v + '%' } },
            x: { grid: { display: false } },
          },
        },
      });
    }

    // Activity chart
    const ctxAct = document.getElementById('chart-activity');
    if (ctxAct) {
      _actChart = new Chart(ctxAct, {
        type: 'bar',
        data: {
          labels: actData.labels,
          datasets: [{
            label: 'Trainings',
            data: actData.data,
            backgroundColor: 'rgba(10,10,10,.8)',
            borderRadius: 4,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' } },
            x: { grid: { display: false } },
          },
        },
      });
    }
  }

  function _updateCharts(user) {
    if (_perfChart) {
      const d = _makePerformanceData(user);
      _perfChart.data.datasets[0].data = d.data;
      _perfChart.update();
    }
    if (_actChart) {
      const d = _makeActivityData(user);
      _actChart.data.datasets[0].data = d.data;
      _actChart.update();
    }
  }

  // ---- Tabs -------------------------------------------------
  function _bindTabs() {
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.profile-tab-content').forEach(c => {
          c.classList.toggle('active', c.id === 'tab-' + target);
        });
      });
    });
  }

  // ---- Edit Modal -------------------------------------------
  function _bindEditModal() {
    const modal  = document.getElementById('profile-edit-modal');
    const openBtn= document.getElementById('profile-edit-btn');
    const closeBtn = document.getElementById('profile-edit-close');
    const cancelBtn= document.getElementById('profile-edit-cancel');
    const saveBtn  = document.getElementById('profile-edit-save');

    openBtn.addEventListener('click', () => {
      const u = Auth.getUser();
      if (!u) return;
      document.getElementById('edit-name').value     = u.name     || '';
      document.getElementById('edit-sport').value    = u.sport    || 'fussball';
      document.getElementById('edit-agegroup').value = u.ageGroup || '';
      document.getElementById('edit-location').value = u.location || '';
      document.getElementById('edit-bio').value      = u.bio      || '';
      modal.classList.remove('hidden');
    });

    [closeBtn, cancelBtn].forEach(btn => btn.addEventListener('click', () => modal.classList.add('hidden')));

    saveBtn.addEventListener('click', () => {
      const name     = document.getElementById('edit-name').value.trim();
      const sport    = document.getElementById('edit-sport').value;
      const ageGroup = document.getElementById('edit-agegroup').value;
      const location = document.getElementById('edit-location').value.trim();
      const bio      = document.getElementById('edit-bio').value.trim();

      if (!name) { Toast.show('Name darf nicht leer sein.', 'error'); return; }

      Auth.updateProfile({ name, sport, ageGroup, location, bio });
      Auth.addXP(bio ? 50 : 0);
      modal.classList.add('hidden');
      Toast.show('Profil gespeichert!', 'success');
    });

    // Close on overlay click
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  }

  // ---- Guest register btn -----------------------------------
  function _bindGuestBtn() {
    document.getElementById('profile-guest-register').addEventListener('click', () => {
      document.getElementById('auth-modal').classList.remove('hidden');
    });
  }

  // ---- Logout + Delete account ----------------------------
  function _bindAccountActions() {
    // Logout button (in profile header)
    document.getElementById('profile-logout-btn').addEventListener('click', () => {
      Auth.logout();
      Toast.show('Erfolgreich abgemeldet.', 'success');
      Router.go('home');
    });

    // Open delete confirmation modal
    document.getElementById('profile-delete-btn').addEventListener('click', () => {
      document.getElementById('profile-delete-modal').classList.remove('hidden');
    });

    // Cancel delete
    document.getElementById('profile-delete-cancel').addEventListener('click', () => {
      document.getElementById('profile-delete-modal').classList.add('hidden');
    });
    document.getElementById('profile-delete-modal-close').addEventListener('click', () => {
      document.getElementById('profile-delete-modal').classList.add('hidden');
    });
    document.getElementById('profile-delete-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('profile-delete-modal')) {
        document.getElementById('profile-delete-modal').classList.add('hidden');
      }
    });

    // Confirm delete
    document.getElementById('profile-delete-confirm').addEventListener('click', () => {
      Auth.deleteAccount();
      document.getElementById('profile-delete-modal').classList.add('hidden');
      Toast.show('Konto gelöscht. Du kannst dich jetzt neu registrieren.', 'success');
      Router.go('home');
    });
  }

  return { init, render };
})();

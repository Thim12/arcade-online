/**
 * app.js – Main entry point
 * Initialises all modules, auth modal, onboarding, nav.
 */

// ============================================================
// TOAST HELPER
// ============================================================
const Toast = (() => {
  function show(message, type = 'default', duration = 3200) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  }
  return { show };
})();

// ============================================================
// FAB BADGE – unread message count
// ============================================================
function _updateFabBadge() {
  const badge = document.getElementById('fab-badge');
  if (!badge) return;
  const count = Auth.getUnreadCount();
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ============================================================
// AUTH MODAL
// ============================================================
function initAuthModal() {
  const modal      = document.getElementById('auth-modal');
  const closeBtn   = document.getElementById('auth-modal-close');
  const loginBtn   = document.getElementById('btn-login');
  const registerBtn= document.getElementById('btn-register');
  const mobileLogin   = document.getElementById('mobile-login');
  const mobileRegister= document.getElementById('mobile-register');
  const tabLoginBtn   = document.getElementById('tab-login-btn');
  const tabRegBtn     = document.getElementById('tab-register-btn');
  const loginForm     = document.getElementById('login-form');
  const regForm       = document.getElementById('register-form');
  const loginError    = document.getElementById('login-error');
  const regError      = document.getElementById('reg-error');

  function open(tab = 'login') {
    modal.classList.remove('hidden');
    _switchTab(tab);
  }

  function close() { modal.classList.add('hidden'); }

  function _switchTab(tab) {
    const isLogin = tab === 'login';
    tabLoginBtn.classList.toggle('active', isLogin);
    tabRegBtn.classList.toggle('active', !isLogin);
    loginForm.classList.toggle('hidden', !isLogin);
    regForm.classList.toggle('hidden', isLogin);
    loginError.classList.add('hidden');
    regError.classList.add('hidden');
  }

  closeBtn.addEventListener('click', close);
  // Kein Schließen durch Klick daneben – nur das X schließt das Modal
  loginBtn.addEventListener('click', () => open('login'));
  registerBtn.addEventListener('click', () => open('register'));
  if (mobileLogin)    mobileLogin.addEventListener('click', () => open('login'));
  if (mobileRegister) mobileRegister.addEventListener('click', () => open('register'));
  tabLoginBtn.addEventListener('click', () => _switchTab('login'));
  tabRegBtn.addEventListener('click', () => _switchTab('register'));

  // Login form submit
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const email    = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const res = await Auth.login({ email, password });
    if (res.ok) {
      close();
      Toast.show('Willkommen zurück, ' + res.user.name + '!', 'success');
    } else {
      loginError.textContent = res.error;
      loginError.classList.remove('hidden');
    }
  });

  // Register form submit
  regForm.addEventListener('submit', async e => {
    e.preventDefault();
    regError.classList.add('hidden');

    // DSGVO-Pflicht-Checkbox prüfen
    const dsgvoCheck = document.getElementById('reg-dsgvo');
    if (!dsgvoCheck.checked) {
      regError.innerHTML = 'Registrierung fehlgeschlagen: Bitte stimme der <button type="button" class="link-btn" id="reg-error-datenschutz-link">Datenschutzerklärung</button> zu, um ein Konto erstellen zu können.';
      regError.classList.remove('hidden');
      // Link im Fehlertext auch klickbar machen
      const errLink = document.getElementById('reg-error-datenschutz-link');
      if (errLink) errLink.addEventListener('click', () => {
        document.getElementById('datenschutz-modal').classList.remove('hidden');
      });
      return;
    }

    const name     = document.getElementById('reg-name').value;
    const email    = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const sport    = document.getElementById('reg-sport').value;
    const location = document.getElementById('reg-location').value;
    const ageGroup = document.getElementById('reg-agegroup').value;
    const gender   = document.getElementById('reg-gender').value;
    const res = await Auth.register({ name, email, password, sport, location, ageGroup, gender });
    if (res.ok) {
      close();
      Toast.show('Konto erstellt! Willkommen, ' + res.user.name + '!', 'success');
      // Show onboarding for new users
      if (res.user.isNew) {
        setTimeout(() => showOnboarding(), 400);
      }
    } else {
      regError.textContent = res.error;
      regError.classList.remove('hidden');
    }
  });

  // Datenschutz-Link im Registrierformular öffnet das Modal (Auth-Modal bleibt offen)
  document.getElementById('reg-datenschutz-link').addEventListener('click', () => {
    const dsModal = document.getElementById('datenschutz-modal');
    if (dsModal) dsModal.classList.remove('hidden');
  });
}

// ============================================================
// ONBOARDING
// ============================================================
function showOnboarding() {
  const overlay = document.getElementById('onboarding');
  overlay.classList.remove('hidden');
  let step = 0;
  let selections = {};

  function _goStep(n) {
    document.querySelectorAll('.onboarding-step').forEach(s => s.classList.toggle('active', +s.dataset.step === n));
    document.querySelectorAll('.onboarding-dot').forEach(d => d.classList.toggle('active', +d.dataset.step <= n));
    step = n;
  }

  // Sport selection
  document.querySelectorAll('.onboarding-sport-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.onboarding-sport-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selections.sport = btn.dataset.sport;
      setTimeout(() => _goStep(1), 300);
    });
  });

  // Level selection
  document.querySelectorAll('.onboarding-level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.onboarding-level-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selections.level = btn.dataset.level;
      setTimeout(() => _goStep(2), 300);
    });
  });

  // Age group selection (new step 2)
  document.querySelectorAll('.onboarding-age-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.onboarding-age-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selections.ageGroup = btn.dataset.age;
      setTimeout(() => _goStep(3), 300);
    });
  });

  // Club status (now step 3)
  document.querySelectorAll('.onboarding-club-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.onboarding-club-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selections.clubStatus = btn.dataset.club;
      setTimeout(() => _goStep(4), 300);
    });
  });

  // Finish (now step 4)
  document.getElementById('onboarding-finish').addEventListener('click', () => {
    selections.location = document.getElementById('onboarding-location').value.trim() || 'Hessen';
    Auth.finishOnboarding(selections);
    overlay.classList.add('hidden');
    Toast.show('Profil eingerichtet! Viel Spaß bei Playor Sports!', 'success');
    Router.go('home');
  }, { once: true });

  _goStep(0);
}

// ============================================================
// NAV – scroll effect, hamburger, auth state
// ============================================================
function initNav() {
  const nav  = document.getElementById('main-nav');
  const menu = document.getElementById('mobile-menu');
  const ham  = document.getElementById('nav-hamburger');

  // Scroll effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Hamburger
  ham.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  // Close mobile menu on nav link click
  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => menu.classList.add('hidden'));
  });

  // Auth state → toggle login/register vs user button
  Auth.onAuthChange(user => {
    const loginBtn   = document.getElementById('btn-login');
    const registerBtn= document.getElementById('btn-register');
    const userBtn    = document.getElementById('nav-user-btn');
    const fab        = document.getElementById('fab-chat');

    if (user) {
      loginBtn.classList.add('hidden');
      registerBtn.classList.add('hidden');
      userBtn.classList.remove('hidden');
      document.getElementById('nav-avatar').textContent = user.name[0].toUpperCase();
      fab.classList.remove('hidden');
      _updateFabBadge();
    } else {
      loginBtn.classList.remove('hidden');
      registerBtn.classList.remove('hidden');
      userBtn.classList.add('hidden');
      fab.classList.add('hidden');
      _updateFabBadge();
    }
  });

  // Poll unread count every 5 s when user is logged in
  setInterval(_updateFabBadge, 5000);

  // User button click → profile
  document.getElementById('nav-user-btn').addEventListener('click', () => {
    Router.go('profile');
    menu.classList.add('hidden');
  });
}

// ============================================================
// ROUTE CHANGE HANDLER
// ============================================================
function initRouteHandler() {
  document.addEventListener('routeChange', e => {
    const { viewId, params } = e.detail;

    switch (viewId) {
      case 'choice':
        SearchView.showChoice(params);
        break;
      case 'results':
        if (params && params.query) SearchView.showQuery(params.query);
        break;
      case 'social':
        SocialView.renderSocial();
        break;
      case 'chat':
        ChatView.renderChatList();
        break;
      case 'profile':
        ProfileView.render(Auth.getUser());
        break;
      case 'admin-review':
        AdminReviewView.render(params);
        break;
    }
  });
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Init config (Supabase or demo)
  initSupabase().then(() => {
    if (DEMO_MODE) {
      console.info('[Playor Sports] Demo-Modus aktiv (localStorage). Supabase-Keys in js/config.js eintragen um echtes Backend zu nutzen.');
    }
  });

  // 2. Init auth (restore session)
  Auth.init();

  // 3. Init router
  Router.init();

  // 4. Init nav
  initNav();

  // 5. Init auth modal
  initAuthModal();

  // 6. Init view modules
  HomeView.init();
  SearchView.init();
  ProfileView.init();
  SocialView.init();
  ChatView.init();
  RegisterClubView.init();
  AdminReviewView.init();

  // 7. Route change handler
  initRouteHandler();

  // 8. Seed mock users into localStorage if not already there
  _seedMockUsers();

  // 9. Footer modals handled via inline onclick in HTML
});

function _seedMockUsers() {
  const key = 'sm_users';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const existingIds = new Set(existing.map(u => u.id));
  const toAdd = MOCK_USERS.filter(u => !existingIds.has(u.id));
  if (toAdd.length > 0) {
    localStorage.setItem(key, JSON.stringify([...existing, ...toAdd]));
  }
}

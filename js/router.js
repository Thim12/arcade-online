/**
 * router.js – SPA View Router
 * Shows/hides view sections, updates nav active state,
 * manages browser history (hash-based).
 */

const Router = (() => {
  const VIEWS = ['home', 'choice', 'results', 'detail', 'profile', 'social', 'public-profile', 'chat', 'register-verein', 'register-turnier', 'admin-review'];
  let _current = 'home';
  let _params  = {};

  // ---- Helpers ------------------------------------------------
  function _setActive(viewId) {
    VIEWS.forEach(id => {
      const el = document.getElementById('view-' + id);
      if (el) el.classList.toggle('active', id === viewId);
    });

    // Nav links
    document.querySelectorAll('.nav-link, .mobile-link').forEach(a => {
      const target = a.dataset.view;
      a.classList.toggle('active', target === viewId);
    });

    _current = viewId;
  }

  // ---- Public API ---------------------------------------------

  /**
   * Navigate to a view.
   * @param {string} viewId – e.g. 'home', 'results'
   * @param {object} params – optional data passed to the view
   * @param {boolean} pushState – add to browser history
   */
  function go(viewId, params = {}, pushState = true) {
    if (!VIEWS.includes(viewId)) {
      console.warn('Unknown view:', viewId);
      return;
    }
    _params = params;

    if (pushState) {
      const hash = viewId === 'home' ? '' : '#' + viewId;
      history.pushState({ viewId, params }, '', hash || window.location.pathname);
    }

    _setActive(viewId);

    // Scroll to top (unless it is chat which manages its own scroll)
    if (viewId !== 'chat') window.scrollTo({ top: 0, behavior: 'smooth' });

    // Notify view modules
    const ev = new CustomEvent('routeChange', { detail: { viewId, params } });
    document.dispatchEvent(ev);
  }

  function current()    { return _current; }
  function getParams()  { return _params; }

  /**
   * Initialise: handle popstate and click delegation.
   */
  function init() {
    // Resolve initial hash
    const hash = window.location.hash.replace('#', '');
    const initial = VIEWS.includes(hash) ? hash : 'home';
    _setActive(initial);

    // Browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.viewId) {
        go(e.state.viewId, e.state.params || {}, false);
      } else {
        go('home', {}, false);
      }
    });

    // Delegated clicks on [data-view]
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-view]');
      if (!el) return;
      const viewId = el.dataset.view;
      if (VIEWS.includes(viewId)) {
        e.preventDefault();
        go(viewId);
      }
    });
  }

  return { init, go, current, getParams };
})();

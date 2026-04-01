/**
 * views/home.js – Hero parallax, sport card clicks, hero search
 */

const HomeView = (() => {
  function init() {
    _bindHeroBg();
    _bindSearch();
    _bindTags();
    _bindSportCards();
    _bindRegisterCTA();
  }

  /* Register CTA buttons */
  function _bindRegisterCTA() {
    const btnV = document.getElementById('cta-register-verein');
    const btnT = document.getElementById('cta-register-turnier');
    if (btnV) btnV.addEventListener('click', () => Router.go('register-verein'));
    if (btnT) btnT.addEventListener('click', () => Router.go('register-turnier'));
  }

  /* Hero background – zoom-in animation once per session, then parallax */
  function _bindHeroBg() {
    const bg  = document.getElementById('hero-bg');
    const img = document.getElementById('hero-bg-img');
    if (!bg || !img) return;

    // Zoom animation only on first visit per session
    const visited = sessionStorage.getItem('sm_hero_visited');
    if (!visited) {
      sessionStorage.setItem('sm_hero_visited', '1');
      // Wait for image to be loaded (or already complete) before starting transition
      function startZoom() {
        requestAnimationFrame(() => bg.classList.add('zoom-done'));
      }
      if (img.complete) {
        startZoom();
      } else {
        img.addEventListener('load', startZoom, { once: true });
      }
    } else {
      // Already visited – skip animation, show full-size immediately
      img.style.transform = 'scale(1)';
      img.style.transition = 'none';
    }

    window.addEventListener('scroll', () => {
      if (Router.current() !== 'home') return;
      const offset = window.scrollY;
      img.style.transform = `scale(1) translateY(${offset * 0.25}px)`;
    }, { passive: true });
  }

  /* Hero search bar */
  function _bindSearch() {
    const input = document.getElementById('hero-search-input');
    const btn   = document.getElementById('hero-search-btn');

    function doSearch() {
      const val = input.value.trim().toLowerCase();
      if (!val) return;

      // Map keyword to sport
      const sportMap = {
        tennis: 'tennis',
        fußball: 'fussball',
        fussball: 'fussball',
        basketball: 'basketball',
      };

      let sport = null;
      for (const [kw, sp] of Object.entries(sportMap)) {
        if (val.includes(kw)) { sport = sp; break; }
      }

      if (sport) {
        Router.go('choice', { sport });
      } else {
        // Generic search → results with query
        Router.go('results', { query: val });
      }
    }

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  }

  /* Quick-tag pills in hero */
  function _bindTags() {
    document.querySelectorAll('.tag[data-sport]').forEach(tag => {
      tag.addEventListener('click', () => {
        Router.go('choice', { sport: tag.dataset.sport });
      });
    });
  }

  /* Sport cards */
  function _bindSportCards() {
    document.querySelectorAll('.sport-card[data-sport]').forEach(card => {
      card.addEventListener('click', () => {
        Router.go('choice', { sport: card.dataset.sport });
      });
    });
  }

  return { init };
})();

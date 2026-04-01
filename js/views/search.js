/**
 * views/search.js
 * Handles: Choice view, Results view (OSM + Demo fallback), Detail view
 */

const SearchView = (() => {
  // State
  let _sport     = null;
  let _type      = 'verein';   // 'verein' | 'turnier'
  let _results   = [];
  let _userLat   = null;
  let _userLng   = null;
  let _hasGeo    = false;

  // Default center: Heusenstamm
  const DEFAULT_LAT = 50.055;
  const DEFAULT_LNG = 8.801;

  // ---- CHOICE VIEW -----------------------------------------
  function initChoice() {
    document.getElementById('choice-back').addEventListener('click', () => Router.go('home'));
    document.getElementById('choice-verein').addEventListener('click', () => {
      _type = 'verein';
      _loadResults();
    });
    document.getElementById('choice-turnier').addEventListener('click', () => {
      _type = 'turnier';
      _loadResults();
    });
  }

  function showChoice(params) {
    _sport = params.sport || 'fussball';
    document.getElementById('choice-sport-label').textContent = sportLabel(_sport);
  }

  // ---- RESULTS VIEW ----------------------------------------
  function initResults() {
    document.getElementById('results-back').addEventListener('click', () => Router.go('choice', { sport: _sport }));
    document.getElementById('filter-radius').addEventListener('change', _applyFilters);
    document.getElementById('filter-sort').addEventListener('change',   _applyFilters);
    document.getElementById('btn-locate').addEventListener('click',    _requestGeo);
  }

  async function _loadResults() {
    Router.go('results');
    const title = `${sportLabel(_sport)}${_type === 'turnier' ? 'turniere' : 'vereine'} in Hessen`;
    document.getElementById('results-title').textContent = title;

    // Show loading
    document.getElementById('results-loading').classList.remove('hidden');
    document.getElementById('results-grid').innerHTML    = '';
    document.getElementById('results-empty').classList.add('hidden');
    _hideGeoBanner();

    // Pre-fill age group from user profile (kept for reference, no UI select any more)
    // const user = Auth.getUser();

    // Try OSM first
    const osmResults = await _fetchOSM(_sport, _type);

    if (osmResults.length > 0) {
      _results = osmResults;
    } else {
      // Fallback: demo clubs
      _results = DEMO_CLUBS.filter(c => c.sport === _sport && c.type === _type);
    }

    document.getElementById('results-loading').classList.add('hidden');

    // If no geo: show all with banner, hide radius dropdown
    _updateGeoUI();
    _applyFilters();
  }

  /**
   * Update geo button and radius label depending on geo state.
   * The radius filter is always visible; when no GPS we use Heusenstamm
   * as reference and show a small note in the label.
   */
  function _updateGeoUI() {
    const locateBtn   = document.getElementById('btn-locate');
    const radiusLabel = document.getElementById('filter-radius-label');

    if (_hasGeo) {
      if (locateBtn) {
        locateBtn.textContent = 'Standort aktiv ✓';
        locateBtn.classList.add('btn-geo-active');
      }
      if (radiusLabel) radiusLabel.textContent = 'Umkreis';
      _hideGeoBanner();
    } else {
      if (locateBtn) {
        locateBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Standort`;
        locateBtn.classList.remove('btn-geo-active');
      }
      if (radiusLabel) radiusLabel.textContent = 'Umkreis (ab Heusenstamm)';
      _showGeoBanner();
    }
  }

  function _showGeoBanner() {
    let banner = document.getElementById('geo-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'geo-banner';
      banner.className = 'geo-banner';
      banner.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Standort aktivieren für Umkreissuche – aktuell werden alle Vereine angezeigt.`;
      const grid = document.getElementById('results-grid');
      grid.parentNode.insertBefore(banner, grid);
    }
    banner.classList.remove('hidden');
  }

  function _hideGeoBanner() {
    const banner = document.getElementById('geo-banner');
    if (banner) banner.classList.add('hidden');
  }

  /**
   * Fetch clubs/courts from OpenStreetMap Overpass API.
   */
  async function _fetchOSM(sport, type) {
    const sportTagMap = {
      tennis:     'sport=tennis',
      fussball:   'sport=soccer',
      basketball: 'sport=basketball',
    };

    const tag   = sportTagMap[sport] || 'sport=soccer';
    const bbox  = '49.5,8.2,50.7,9.6'; // Hessen bounding box (approx)
    const query = `
      [out:json][timeout:15];
      (
        node[${tag}][name](${bbox});
        way[${tag}][name](${bbox});
        relation[${tag}][name](${bbox});
      );
      out center 40;
    `;

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      if (!res.ok) return [];
      const data = await res.json();

      return (data.elements || []).map(el => ({
        id:        'osm_' + el.id,
        sport,
        type:      'verein',
        name:      el.tags.name || 'Unbekannt',
        address:   _osmAddress(el.tags),
        lat:       el.lat || el.center?.lat,
        lng:       el.lon || el.center?.lon,
        members:   null,
        courts:    null,
        founded:   null,
        phone:     el.tags['phone'] || el.tags['contact:phone'] || null,
        website:   el.tags['website'] || el.tags['contact:website'] || null,
        description: `${sportLabel(sport)}-Anlage in Hessen (OpenStreetMap-Daten).`,
        image:     _sportImg(sport),
        ageGroups: null,
      })).filter(c => c.lat && c.lng);

    } catch {
      return [];
    }
  }

  function _osmAddress(tags) {
    const parts = [];
    if (tags['addr:street'])      parts.push(tags['addr:street'] + (tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''));
    if (tags['addr:postcode'])    parts.push(tags['addr:postcode']);
    if (tags['addr:city'])        parts.push(tags['addr:city']);
    return parts.join(', ') || 'Hessen';
  }

  function _sportImg(sport) {
    const imgs = {
      tennis:     'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
      fussball:   'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80',
      basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80',
    };
    return imgs[sport] || imgs.fussball;
  }

  function _applyFilters() {
    const radius = parseInt(document.getElementById('filter-radius').value) || 9999;
    _renderResults(_results, radius);
  }

  function _renderResults(clubs, radius) {
    const grid  = document.getElementById('results-grid');
    const empty = document.getElementById('results-empty');
    const sort  = document.getElementById('filter-sort').value;

    // Reference point: user geo if available, else Heusenstamm default
    const refLat = _hasGeo ? _userLat : DEFAULT_LAT;
    const refLng = _hasGeo ? _userLng : DEFAULT_LNG;

    let filtered = clubs;

    // Radius filter – always active (uses GPS if available, else Heusenstamm default)
    if (radius < 9999) {
      filtered = filtered.filter(c => distance(refLat, refLng, c.lat, c.lng) <= radius);
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      const radiusVal = parseInt(document.getElementById('filter-radius').value) || 9999;
      if (radiusVal < 9999) {
        empty.innerHTML = `<p>Keine ${_type === 'turnier' ? 'Turniere' : 'Vereine'} in ${radiusVal} km gefunden. Versuche einen größeren Umkreis.</p>`;
      } else {
        empty.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
      }
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');

    // Sort
    if (sort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'distance') {
      filtered.sort((a, b) =>
        distance(refLat, refLng, a.lat, a.lng) -
        distance(refLat, refLng, b.lat, b.lng)
      );
    }

    grid.innerHTML = filtered.map(club => {
      const dist = distance(refLat, refLng, club.lat, club.lng).toFixed(1);
      const icon = sportEmoji(club.sport);
      const sportCls = club.sport;
      const metaHtml = club.type === 'turnier' && club.date
        ? `<span class="sport-badge sport-badge--${sportCls}">${fmtDate(club.date)}</span>
           <span class="sport-badge sport-badge--${sportCls}">${club.participants} Teams</span>`
        : `${club.members ? `<span class="sport-badge sport-badge--${sportCls}">${club.members} Mitgl.</span>` : ''}
           ${club.courts ? `<span class="sport-badge sport-badge--${sportCls}">${club.courts} Plätze</span>` : ''}`;

      return `
        <div class="result-card" data-id="${club.id}">
          <div class="result-card-icon result-card-icon--${sportCls}">${icon}</div>
          <div class="result-card-body">
            <div class="result-card-name">${club.name}</div>
            <div class="result-card-address">${club.address}</div>
            <div class="result-card-meta">${metaHtml}</div>
          </div>
          <div class="result-card-distance">${dist} km</div>
        </div>
      `;
    }).join('');

    // Click → detail
    grid.querySelectorAll('.result-card').forEach(card => {
      card.addEventListener('click', () => {
        const id   = card.dataset.id;
        const club = filtered.find(c => c.id === id);
        if (club) showDetail(club);
      });
    });
  }

  function _requestGeo() {
    if (!navigator.geolocation) {
      Toast.show('Standort wird von diesem Browser nicht unterstützt.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        _userLat = pos.coords.latitude;
        _userLng = pos.coords.longitude;
        _hasGeo  = true;
        Toast.show('Standort erkannt!', 'success');
        _updateGeoUI();
        _applyFilters();
      },
      () => {
        Toast.show('Standort konnte nicht ermittelt werden.', 'error');
      }
    );
  }

  // ---- DETAIL VIEW -----------------------------------------
  function showDetail(club) {
    // Fill hero
    const img = document.getElementById('detail-hero-img');
    if (img && club.image) {
      img.src = club.image;
      img.alt = club.name;
    }
    document.getElementById('detail-sport-badge').textContent = sportLabel(club.sport);
    document.getElementById('detail-name').textContent        = club.name;
    document.getElementById('detail-address').textContent     = club.address;

    // Stats
    document.getElementById('detail-members').textContent  = club.members  || '–';
    document.getElementById('detail-courts').textContent   = club.courts   || '–';
    document.getElementById('detail-founded').textContent  = club.founded  || (club.date ? fmtDate(club.date) : '–');

    // Info
    document.getElementById('detail-description').textContent = club.description || '';

    // Age groups
    const agRow = document.getElementById('detail-agegroups-row');
    const agEl  = document.getElementById('detail-agegroups');
    if (agRow && agEl) {
      if (club.ageGroups && club.ageGroups.length > 0) {
        agEl.textContent = club.ageGroups.join(', ');
        agRow.classList.remove('hidden');
      } else {
        agRow.classList.add('hidden');
      }
    }

    // Contact
    const webEl = document.getElementById('detail-website');
    const webRow = document.getElementById('detail-website-row');
    if (club.website) {
      webEl.href        = club.website;
      webEl.textContent = club.website.replace(/^https?:\/\//, '');
      webRow.classList.remove('hidden');
    } else {
      webRow.classList.add('hidden');
    }

    const phoneEl  = document.getElementById('detail-phone');
    const phoneRow = document.getElementById('detail-phone-row');
    if (club.phone) {
      phoneEl.textContent = club.phone;
      phoneRow.classList.remove('hidden');
    } else {
      phoneRow.classList.add('hidden');
    }

    Router.go('detail');
  }

  function initDetail() {
    document.getElementById('detail-back').addEventListener('click', () => Router.go('results'));
    document.getElementById('detail-join-btn').addEventListener('click', () => {
      if (!Auth.isLoggedIn()) {
        Toast.show('Bitte erst anmelden, um beizutreten.', 'info');
        document.getElementById('auth-modal').classList.remove('hidden');
      } else {
        Auth.addXP(100);
        Toast.show('Anfrage gesendet! +100 XP', 'success');
      }
    });
    document.getElementById('detail-save-btn').addEventListener('click', () => {
      Toast.show('Gespeichert!', 'success');
    });
  }

  /**
   * Called when hero search sends a free-text query directly to results.
   * Shows all matching clubs across all sports.
   */
  function showQuery(query) {
    const q = query.toLowerCase();
    document.getElementById('results-title').textContent = `Suchergebnisse: "${query}"`;

    // Search across all clubs in all sports/types
    const matches = DEMO_CLUBS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );

    _results = matches.length > 0 ? matches : DEMO_CLUBS;
    document.getElementById('results-loading').classList.add('hidden');
    document.getElementById('results-empty').classList.add('hidden');
    _hideGeoBanner();
    _updateGeoUI();
    _applyFilters();
  }

  return { init() { initChoice(); initResults(); initDetail(); }, showChoice, showDetail, showQuery };
})();

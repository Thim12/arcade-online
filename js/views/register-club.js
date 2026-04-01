/**
 * views/register-club.js
 * Koordinator für Verein- und Turnier-Registrierung.
 *
 * Verein-Formular:
 *   – Allgemeine Angaben (Name, Adresse, Gründung, Mitglieder, Beschreibung)
 *   – Sportart-Auswahl mit Tabs (Tennis / Fußball / Basketball, mehrere möglich)
 *   – Kontaktdaten (Website, Telefon, E-Mail, Ansprechpartner)
 *   – Validierung: Pflichtfelder orange + Hinweis; bei fehlenden Feldern Dialog
 *     mit „Trotzdem absenden" (+ optionaler Begründung) oder „Zurück"
 *
 * Turnier-Formular: unverändertes Bindeglied zu sendSubmission()
 */

const RegisterClubView = (() => {

  // ── Sport-Module ─────────────────────────────────────────────
  const SPORT_MODULES = {
    tennis:     { label: 'Tennis',     module: () => TennisForm },
    fussball:   { label: 'Fußball',    module: () => FussballForm },
    basketball: { label: 'Basketball', module: () => BasketballForm },
  };

  let _activeSports = [];   // z.B. ['tennis', 'basketball']
  let _activeTab    = null; // aktuell sichtbarer Sport-Tab

  // ─────────────────────────────────────────────────────────────
  function init() {
    _renderVereinForm();
    _bindTurnierForm();
    _bindBackButtons();
  }

  // ── Back buttons ─────────────────────────────────────────────
  function _bindBackButtons() {
    document.getElementById('register-verein-back')
      ?.addEventListener('click', () => Router.go('home'));
    document.getElementById('register-turnier-back')
      ?.addEventListener('click', () => Router.go('home'));
  }

  // ═══════════════════════════════════════════════════════════
  //  VEREIN FORM
  // ═══════════════════════════════════════════════════════════

  function _renderVereinForm() {
    const container = document.getElementById('rv-form-container');
    if (!container) return;

    _activeSports = [];
    _activeTab    = null;

    container.innerHTML = `
      <!-- ── Allgemeine Infos ────────────────────────────── -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Allgemeine Informationen</h3>
        <div class="reg-form-grid">
          <div class="form-group">
            <label class="form-label">Vereinsname <span class="form-required">*</span></label>
            <input type="text" class="form-input" id="rv-name" placeholder="z.B. TC Blau-Weiß Heusenstamm">
            <span class="form-field-error hidden" id="err-rv-name">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Standort / Adresse <span class="form-required">*</span></label>
            <input type="text" class="form-input" id="rv-address" placeholder="z.B. Hauptstraße 10, 63150 Heusenstamm">
            <span class="form-field-error hidden" id="err-rv-address">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Gegründet (Jahr) <span class="form-optional">(optional)</span></label>
            <input type="number" class="form-input" id="rv-founded" placeholder="z.B. 1965" min="1800" max="2100">
          </div>
          <div class="form-group">
            <label class="form-label">Mitgliederanzahl (ca.) <span class="form-optional">(optional)</span></label>
            <input type="number" class="form-input" id="rv-members" placeholder="z.B. 120" min="1">
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Kurzbeschreibung <span class="form-recommended">★ stark empfohlen</span></label>
            <textarea class="form-input form-textarea" id="rv-description" rows="3"
              placeholder="Wer seid ihr? Was macht euren Verein besonders? Welche Angebote habt ihr?"></textarea>
          </div>
        </div>
      </div>

      <!-- ── Sportart-Auswahl ───────────────────────────── -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Sportart(en) <span class="form-required">*</span></h3>
        <p class="reg-section-hint">Wähle alle Sportarten aus, die dein Verein anbietet. Pro Sportart kannst du detaillierte Informationen eintragen.</p>
        <span class="form-field-error hidden" id="err-rv-sports">Bitte mindestens eine Sportart wählen</span>
        <div class="sport-selector-row" id="rv-sport-selector">
          <button type="button" class="sport-selector-btn" data-sport="tennis">Tennis</button>
          <button type="button" class="sport-selector-btn" data-sport="fussball">Fußball</button>
          <button type="button" class="sport-selector-btn" data-sport="basketball">Basketball</button>
        </div>
        <!-- Sport-Tabs -->
        <div class="sport-tabs hidden" id="rv-sport-tabs">
          <div class="sport-tab-bar" id="rv-sport-tab-bar"></div>
          <div class="sport-tab-content" id="rv-sport-tab-content"></div>
        </div>
      </div>

      <!-- ── Kontaktdaten ───────────────────────────────── -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Kontaktdaten</h3>
        <div class="reg-form-grid">
          <div class="form-group">
            <label class="form-label">Website <span class="form-optional">(optional)</span></label>
            <input type="url" class="form-input" id="rv-website" placeholder="https://mein-verein.de">
          </div>
          <div class="form-group">
            <label class="form-label">Telefon <span class="form-required">*</span></label>
            <input type="tel" class="form-input" id="rv-phone" placeholder="z.B. 069 12345678">
            <span class="form-field-error hidden" id="err-rv-phone">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Kontakt-E-Mail <span class="form-required">*</span></label>
            <input type="email" class="form-input" id="rv-email" placeholder="kontakt@mein-verein.de">
            <span class="form-field-error hidden" id="err-rv-email">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Ansprechpartner <span class="form-required">*</span></label>
            <input type="text" class="form-input" id="rv-contact-name" placeholder="Vor- und Nachname">
            <span class="form-field-error hidden" id="err-rv-contact-name">Angabe fehlt</span>
          </div>
        </div>
      </div>

      <div class="form-error hidden" id="rv-error"></div>
      <div class="reg-form-submit">
        <button type="button" class="btn btn-primary btn-lg" id="rv-submit-btn">Anfrage senden</button>
        <p class="reg-form-hint">Nach dem Absenden prüft unser Team den Eintrag. Wir melden uns bei dir.</p>
      </div>

      <!-- ── "Trotzdem absenden"-Dialog ────────────────── -->
      <div class="partial-submit-dialog hidden" id="rv-partial-dialog">
        <div class="partial-submit-box">
          <h3>Einige Angaben fehlen noch</h3>
          <p class="partial-submit-hint">Fehlende Pflichtangaben sind oben orange markiert. Du kannst trotzdem absenden – bitte hinterlasse dann einen kurzen Hinweis, warum Angaben fehlen (z.B. „Beitrag noch nicht festgelegt").</p>
          <div class="form-group">
            <label class="form-label">Begründung (optional)</label>
            <textarea class="form-input form-textarea" id="rv-partial-reason" rows="2"
              placeholder="z.B. Beitrag noch nicht festgelegt, Trainer noch gesucht ..."></textarea>
          </div>
          <div class="partial-submit-actions">
            <button type="button" class="btn btn-ghost" id="rv-partial-back">Zurück (Formular bearbeiten)</button>
            <button type="button" class="btn btn-primary" id="rv-partial-send">Trotzdem absenden</button>
          </div>
        </div>
      </div>
    `;

    // Sport selector
    document.querySelectorAll('.sport-selector-btn').forEach(btn => {
      btn.addEventListener('click', () => _toggleSport(btn.dataset.sport));
    });

    // Submit
    document.getElementById('rv-submit-btn').addEventListener('click', _handleVereinSubmit);
    document.getElementById('rv-partial-back').addEventListener('click', () => {
      document.getElementById('rv-partial-dialog').classList.add('hidden');
    });
    document.getElementById('rv-partial-send').addEventListener('click', _doVereinSend);
  }

  function _toggleSport(sport) {
    const btn = document.querySelector(`.sport-selector-btn[data-sport="${sport}"]`);
    const idx = _activeSports.indexOf(sport);
    if (idx === -1) {
      _activeSports.push(sport);
      btn.classList.add('active');
      _addSportTab(sport);
    } else {
      _activeSports.splice(idx, 1);
      btn.classList.remove('active');
      _removeSportTab(sport);
    }
    const tabsEl = document.getElementById('rv-sport-tabs');
    tabsEl.classList.toggle('hidden', _activeSports.length === 0);
    // Clear sport error
    document.getElementById('err-rv-sports')?.classList.add('hidden');
  }

  function _addSportTab(sport) {
    const label = SPORT_MODULES[sport].label;
    const bar = document.getElementById('rv-sport-tab-bar');
    const content = document.getElementById('rv-sport-tab-content');

    // Tab button
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'sport-tab-btn';
    tabBtn.id = `rv-tab-btn-${sport}`;
    tabBtn.textContent = label;
    tabBtn.addEventListener('click', () => _switchTab(sport));
    bar.appendChild(tabBtn);

    // Tab panel
    const panel = document.createElement('div');
    panel.className = 'sport-tab-panel hidden';
    panel.id = `rv-tab-panel-${sport}`;
    const innerContainerId = `rv-sport-form-${sport}`;
    panel.innerHTML = `<div id="${innerContainerId}"></div>`;
    content.appendChild(panel);

    // Render sport-specific form
    SPORT_MODULES[sport].module().render(innerContainerId);

    // Switch to this tab
    _switchTab(sport);
  }

  function _removeSportTab(sport) {
    document.getElementById(`rv-tab-btn-${sport}`)?.remove();
    document.getElementById(`rv-tab-panel-${sport}`)?.remove();
    // Switch to first remaining tab if needed
    if (_activeTab === sport && _activeSports.length > 0) {
      _switchTab(_activeSports[0]);
    } else if (_activeSports.length === 0) {
      _activeTab = null;
    }
  }

  function _switchTab(sport) {
    _activeTab = sport;
    document.querySelectorAll('.sport-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sport-tab-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`rv-tab-btn-${sport}`)?.classList.add('active');
    document.getElementById(`rv-tab-panel-${sport}`)?.classList.remove('hidden');
  }

  // ── Validierung ──────────────────────────────────────────────
  function _validateGeneral() {
    const required = [
      { id: 'rv-name',         errId: 'err-rv-name',         label: 'Vereinsname' },
      { id: 'rv-address',      errId: 'err-rv-address',      label: 'Standort / Adresse' },
      { id: 'rv-phone',        errId: 'err-rv-phone',        label: 'Telefon' },
      { id: 'rv-email',        errId: 'err-rv-email',        label: 'Kontakt-E-Mail' },
      { id: 'rv-contact-name', errId: 'err-rv-contact-name', label: 'Ansprechpartner' },
    ];
    const errors = [];
    required.forEach(f => {
      const el = document.getElementById(f.id);
      const errEl = document.getElementById(f.errId);
      const empty = !el?.value?.trim();
      el?.classList.toggle('input-error', empty);
      errEl?.classList.toggle('hidden', !empty);
      if (empty) errors.push(f.label);
    });

    // Sports required
    if (_activeSports.length === 0) {
      document.getElementById('err-rv-sports')?.classList.remove('hidden');
      errors.push('Sportart');
    }

    return errors;
  }

  function _validateSports() {
    let errors = [];
    _activeSports.forEach(sport => {
      const mod = SPORT_MODULES[sport].module();
      const sportErrors = mod.validate();
      errors = errors.concat(sportErrors);
    });
    return errors;
  }

  async function _handleVereinSubmit() {
    const generalErrors = _validateGeneral();
    const sportErrors   = _validateSports();
    const allErrors     = [...generalErrors, ...sportErrors];

    if (allErrors.length > 0) {
      // Show partial-submit dialog
      document.getElementById('rv-partial-dialog').classList.remove('hidden');
      document.getElementById('rv-partial-dialog').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // No errors – send directly
    await _doVereinSend();
  }

  async function _doVereinSend() {
    document.getElementById('rv-partial-dialog').classList.add('hidden');

    const btn = document.getElementById('rv-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Wird gesendet ...';

    const v = id => document.getElementById(id)?.value?.trim() || '';
    const reason = v('rv-partial-reason');

    // Collect data for each sport
    const sportsData = _activeSports.map(sport => SPORT_MODULES[sport].module().getData());

    const baseData = {
      type:         'verein',
      name:         v('rv-name'),
      address:      v('rv-address'),
      founded:      v('rv-founded'),
      members:      v('rv-members'),
      description:  v('rv-description'),
      website:      v('rv-website'),
      phone:        v('rv-phone'),
      contactEmail: v('rv-email'),
      contactName:  v('rv-contact-name'),
      sports:       _activeSports,
      sportsData,
      partialReason: reason,
    };

    // Send one submission per sport (so admin sees each clearly), or one combined
    let lastResult;
    if (sportsData.length === 0) {
      lastResult = await sendSubmission({ ...baseData, sport: 'unbekannt' });
    } else {
      for (const sd of sportsData) {
        lastResult = await sendSubmission({ ...baseData, sport: sd.sport, sportDetails: sd });
      }
    }

    btn.disabled = false;
    btn.textContent = 'Anfrage senden';

    if (lastResult?.ok) {
      // Reset form
      _activeSports = [];
      _activeTab = null;
      _renderVereinForm();
      Toast.show('Dein Verein wurde eingereicht! Wir melden uns.', 'success', 5000);
      Router.go('home');
    } else {
      const errEl = document.getElementById('rv-error');
      if (errEl) {
        errEl.textContent = lastResult?.error || 'Fehler beim Absenden. Bitte erneut versuchen.';
        errEl.classList.remove('hidden');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  TURNIER FORM
  // ═══════════════════════════════════════════════════════════

  function _bindTurnierForm() {
    const form = document.getElementById('register-turnier-form');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      _setSubmitting(true, 'rt');

      const data = {
        type:         'turnier',
        name:         _val('rt-name'),
        sport:        _val('rt-sport'),
        address:      _val('rt-address'),
        date:         _val('rt-date'),
        deadline:     _val('rt-deadline'),
        participants: _val('rt-participants'),
        costs:        _val('rt-costs'),
        ageGroups:    _val('rt-agegroups'),
        description:  _val('rt-description'),
        website:      _val('rt-website'),
        contactEmail: _val('rt-email'),
        phone:        _val('rt-phone'),
        contactName:  _val('rt-contact-name'),
      };

      const missing = _checkRequired(data, ['name', 'sport', 'address', 'date', 'description', 'contactEmail']);
      if (missing) {
        _showError('rt-error', missing);
        _setSubmitting(false, 'rt');
        return;
      }

      const result = await sendSubmission(data);
      _setSubmitting(false, 'rt');

      if (result.ok) {
        form.reset();
        Toast.show('Dein Turnier wurde eingereicht! Wir melden uns.', 'success', 5000);
        Router.go('home');
      } else {
        _showError('rt-error', result.error || 'Fehler beim Absenden. Bitte erneut versuchen.');
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  function _val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _checkRequired(data, keys) {
    const labels = { name: 'Name', sport: 'Sportart', address: 'Adresse', date: 'Datum', description: 'Beschreibung', contactEmail: 'Kontakt-E-Mail' };
    for (const k of keys) {
      if (!data[k]) return `Pflichtfeld fehlt: ${labels[k] || k}`;
    }
    return null;
  }

  function _showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function _setSubmitting(loading, prefix) {
    const btn = document.getElementById(prefix + '-submit-btn');
    const err = document.getElementById(prefix + '-error');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Wird gesendet ...' : 'Anfrage senden';
    if (err) err.classList.add('hidden');
  }

  return { init };
})();

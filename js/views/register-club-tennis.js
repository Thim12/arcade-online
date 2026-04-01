/**
 * register-club-tennis.js
 * Tennis-spezifisches Vereinsformular.
 * Exportiert: TennisForm.render(containerId), TennisForm.getData(), TennisForm.validate()
 */

const TennisForm = (() => {

  const ALTERSKLASSEN = [
    'U8 (Bambini)', 'U10', 'U12', 'U14', 'U16', 'U18 (Junioren)',
    'U21 (Junioren A)', 'Erwachsene Herren', 'Erwachsene Damen',
    'Senioren 30+', 'Senioren 40+', 'Senioren 50+', 'Senioren 60+'
  ];
  const LIGEN = [
    'Kreisliga', 'Bezirksliga', 'Verbandsliga', 'Landesliga',
    'Hessenliga', 'Regionalliga', 'Bundesliga', 'Keine Liga / intern'
  ];
  const LIZENZEN = [
    'Keine Lizenz', 'DTB C-Lizenz', 'DTB B-Lizenz',
    'DTB A-Lizenz', 'DTB A-Lizenz (national)', 'Andere'
  ];

  let _agIdx = 0;
  let _trIdx = 0;

  // ── HTML bauen ──────────────────────────────────────────────
  function render(containerId) {
    const c = document.getElementById(containerId);
    if (!c) return;
    _agIdx = 0; _trIdx = 0;

    c.innerHTML = `
      <!-- Anlagen & Beitrag -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Anlagen &amp; Mitgliedschaft</h3>
        <div class="reg-form-grid">
          <div class="form-group">
            <label class="form-label">Anzahl Tennisplätze <span class="form-required">*</span></label>
            <input type="number" class="form-input" id="tennis-courts" placeholder="z.B. 8" min="1">
            <span class="form-field-error hidden" id="err-tennis-courts">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Davon Hallenplätze <span class="form-optional">(optional)</span></label>
            <input type="number" class="form-input" id="tennis-indoor" placeholder="z.B. 2" min="0">
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Mitgliedsbeitrag <span class="form-recommended">★ stark empfohlen</span></label>
            <input type="text" class="form-input" id="tennis-fee"
              placeholder="z.B. Erwachsene 180 €/Jahr · Junioren 90 €/Jahr · Bambini kostenlos">
          </div>
        </div>
      </div>

      <!-- Altersklassen & Ligen -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Altersklassen &amp; Ligen <span class="form-recommended">★ stark empfohlen</span></h3>
        <p class="reg-section-hint">Alle Altersklassen eintragen, die im Verein aktiv sind. Liga und Spieler sind optional aber empfohlen.</p>
        <div class="agegroup-header-row">
          <span>Altersklasse</span><span>Liga</span><span>Spieler (optional)</span><span></span>
        </div>
        <div id="tennis-ag-list"></div>
        <button type="button" class="btn btn-ghost btn-sm add-row-btn" id="tennis-add-ag">
          + Altersklasse hinzufügen
        </button>
      </div>

      <!-- Leistungsorientierung -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Leistungsorientierung <span class="form-required">*</span></h3>
        <div class="reg-form-grid">
          <div class="form-group form-group--full">
            <select class="form-input" id="tennis-competitive">
              <option value="">Bitte wählen</option>
              <option value="hochleistung">Hochleistung – Turnier- &amp; Ligabetrieb, Kader</option>
              <option value="leistung">Leistungsorientiert – aktiver Ligabetrieb</option>
              <option value="beides">Beides – Freizeit &amp; Wettkampf</option>
              <option value="freizeit">Freizeitorientiert – kein Wettkampf</option>
            </select>
            <span class="form-field-error hidden" id="err-tennis-competitive">Angabe fehlt</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Besonderheiten <span class="form-optional">(optional)</span></label>
            <textarea class="form-input form-textarea" id="tennis-comp-extra" rows="2"
              placeholder="z.B. Ex-Profis im Trainerteam, DTB-Stützpunkt, Jugendkader, frühere Profis trainiert ..."></textarea>
          </div>
        </div>
      </div>

      <!-- Training -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Trainingsangebot</h3>
        <div class="reg-form-grid">
          <div class="form-group">
            <label class="form-label">Gruppentraining – Preis <span class="form-required">*</span></label>
            <input type="text" class="form-input" id="tennis-grp-price" placeholder="z.B. 12 €/Einheit">
            <span class="form-field-error hidden" id="err-tennis-grp-price">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Gruppentraining – Einheiten/Woche</label>
            <input type="number" class="form-input" id="tennis-grp-sessions" placeholder="z.B. 3" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Gruppentraining – für Altersklassen</label>
            <input type="text" class="form-input" id="tennis-grp-ages" placeholder="z.B. U10 bis Erwachsene">
          </div>
          <div class="form-group">
            <label class="form-label">Paartraining (2er) – Preis <span class="form-optional">(optional)</span></label>
            <input type="text" class="form-input" id="tennis-pair-price" placeholder="z.B. 35 €/Stunde">
          </div>
          <div class="form-group">
            <label class="form-label">Einzeltraining – Preis <span class="form-optional">(optional)</span></label>
            <input type="text" class="form-input" id="tennis-single-price" placeholder="z.B. 55 €/Stunde">
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Spezialisierung / Besondere Angebote <span class="form-optional">(optional)</span></label>
            <input type="text" class="form-input" id="tennis-special"
              placeholder="z.B. Fokus Jugend U12–U18, Feriencamp, Turniervorbereitung ...">
          </div>
        </div>
      </div>

      <!-- Trainer -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Trainer <span class="form-optional">(optional)</span></h3>
        <div class="trainer-header-row"><span>Name</span><span>Lizenz / Ausbildung</span><span></span></div>
        <div id="tennis-tr-list"></div>
        <button type="button" class="btn btn-ghost btn-sm add-row-btn" id="tennis-add-tr">
          + Trainer hinzufügen
        </button>
      </div>
    `;

    // Initial-Zeile + Buttons
    _addAg();
    document.getElementById('tennis-add-ag').addEventListener('click', _addAg);
    document.getElementById('tennis-add-tr').addEventListener('click', _addTr);
  }

  function _addAg() {
    const i = _agIdx++;
    const agOpts = ALTERSKLASSEN.map(a => `<option value="${a}">${a}</option>`).join('');
    const ligaOpts = LIGEN.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('tennis-ag-list').insertAdjacentHTML('beforeend', `
      <div class="agegroup-row" id="tennis-ag-${i}">
        <select class="form-input" id="tennis-ag-k-${i}">
          <option value="">Wählen</option>${agOpts}
        </select>
        <select class="form-input" id="tennis-ag-l-${i}">
          <option value="">Liga</option>${ligaOpts}
        </select>
        <input type="text" class="form-input" id="tennis-ag-p-${i}" placeholder="Spieler (optional)">
        <button type="button" class="btn-remove-row" title="Entfernen"
          onclick="document.getElementById('tennis-ag-${i}').remove()">✕</button>
      </div>`);
  }

  function _addTr() {
    const i = _trIdx++;
    const lizOpts = LIZENZEN.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('tennis-tr-list').insertAdjacentHTML('beforeend', `
      <div class="trainer-row" id="tennis-tr-${i}">
        <input type="text" class="form-input" id="tennis-tr-n-${i}" placeholder="Name des Trainers">
        <select class="form-input" id="tennis-tr-l-${i}">${lizOpts}</select>
        <button type="button" class="btn-remove-row" title="Entfernen"
          onclick="document.getElementById('tennis-tr-${i}').remove()">✕</button>
      </div>`);
  }

  // ── Daten sammeln ────────────────────────────────────────────
  function getData() {
    const v = id => document.getElementById(id)?.value?.trim() || '';

    const agegroups = [];
    document.querySelectorAll('[id^="tennis-ag-"]:not([id$="-list"])').forEach(row => {
      if (!row.classList.contains('agegroup-row')) return;
      const i = row.id.replace('tennis-ag-', '');
      const k = document.getElementById(`tennis-ag-k-${i}`)?.value || '';
      if (k) agegroups.push({
        klasse:  k,
        liga:    document.getElementById(`tennis-ag-l-${i}`)?.value || '',
        spieler: document.getElementById(`tennis-ag-p-${i}`)?.value?.trim() || ''
      });
    });

    const trainers = [];
    document.querySelectorAll('[id^="tennis-tr-"]:not([id$="-list"])').forEach(row => {
      if (!row.classList.contains('trainer-row')) return;
      const i = row.id.replace('tennis-tr-', '');
      const n = document.getElementById(`tennis-tr-n-${i}`)?.value?.trim() || '';
      if (n) trainers.push({ name: n, lizenz: document.getElementById(`tennis-tr-l-${i}`)?.value || '' });
    });

    return {
      sport: 'tennis',
      courts:        v('tennis-courts'),
      indoorCourts:  v('tennis-indoor'),
      fee:           v('tennis-fee'),
      agegroups,
      competitive:   v('tennis-competitive'),
      competitiveExtra: v('tennis-comp-extra'),
      groupPrice:    v('tennis-grp-price'),
      groupSessions: v('tennis-grp-sessions'),
      groupAges:     v('tennis-grp-ages'),
      pairPrice:     v('tennis-pair-price'),
      singlePrice:   v('tennis-single-price'),
      specialization: v('tennis-special'),
      trainers,
    };
  }

  // ── Validierung ──────────────────────────────────────────────
  function validate() {
    const required = [
      { id: 'tennis-courts',      errId: 'err-tennis-courts',      label: 'Anzahl Tennisplätze' },
      { id: 'tennis-competitive', errId: 'err-tennis-competitive', label: 'Leistungsorientierung (Tennis)' },
      { id: 'tennis-grp-price',   errId: 'err-tennis-grp-price',   label: 'Gruppentraining Preis (Tennis)' },
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
    return errors;
  }

  return { render, getData, validate };
})();

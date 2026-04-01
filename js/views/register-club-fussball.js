/**
 * register-club-fussball.js
 * Fußball-spezifisches Vereinsformular.
 * Exportiert: FussballForm.render(containerId), FussballForm.getData(), FussballForm.validate()
 */

const FussballForm = (() => {

  const ALTERSKLASSEN = [
    'Bambini (U7/U8)', 'F-Jugend (U8–U10)', 'E-Jugend (U10–U12)',
    'D-Jugend (U12–U13)', 'C-Jugend (U14–U15)', 'B-Jugend (U16–U17)',
    'A-Jugend (U18–U19)', 'Junioren (U23)', 'Herren', 'Frauen', 'Alte Herren (Ü32)'
  ];
  const LIGEN = [
    'Kreisklasse C', 'Kreisklasse B', 'Kreisklasse A',
    'Gruppenliga', 'Kreisoberliga', 'Bezirksliga',
    'Landesliga', 'Verbandsliga Hessen', 'Hessenliga',
    'Regionalliga Südwest', '3. Liga', 'Keine Liga / intern'
  ];
  const SPIELFORMAT = ['Rasen', 'Kunstrasen', 'Halle', 'Rasen & Kunstrasen'];
  const LIZENZEN = [
    'Keine Lizenz', 'DFB C-Lizenz', 'DFB B-Lizenz',
    'DFB A-Lizenz', 'DFB A-Lizenz (Leistungsfußball)', 'UEFA Pro-Lizenz', 'Andere'
  ];

  let _agIdx = 0;
  let _trIdx = 0;

  // ── HTML bauen ──────────────────────────────────────────────
  function render(containerId) {
    const c = document.getElementById(containerId);
    if (!c) return;
    _agIdx = 0; _trIdx = 0;

    c.innerHTML = `
      <!-- Spielfelder & Beitrag -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Spielfelder &amp; Mitgliedschaft</h3>
        <div class="reg-form-grid">
          <div class="form-group">
            <label class="form-label">Anzahl Spielfelder <span class="form-required">*</span></label>
            <input type="number" class="form-input" id="fussball-fields" placeholder="z.B. 3" min="1">
            <span class="form-field-error hidden" id="err-fussball-fields">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Spielformat <span class="form-required">*</span></label>
            <select class="form-input" id="fussball-format">
              <option value="">Bitte wählen</option>
              ${SPIELFORMAT.map(f => `<option value="${f}">${f}</option>`).join('')}
            </select>
            <span class="form-field-error hidden" id="err-fussball-format">Angabe fehlt</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Mitgliedsbeitrag <span class="form-recommended">★ stark empfohlen</span></label>
            <input type="text" class="form-input" id="fussball-fee"
              placeholder="z.B. Erwachsene 120 €/Jahr · Junioren 60 €/Jahr · Bambini kostenlos">
          </div>
        </div>
      </div>

      <!-- Altersklassen & Ligen -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Altersklassen &amp; Ligen <span class="form-recommended">★ stark empfohlen</span></h3>
        <p class="reg-section-hint">Alle Altersklassen eintragen, die im Verein aktiv sind. Liga und Spieleranzahl sind optional aber empfohlen.</p>
        <div class="agegroup-header-row">
          <span>Altersklasse</span><span>Liga</span><span>Spieler (optional)</span><span></span>
        </div>
        <div id="fussball-ag-list"></div>
        <button type="button" class="btn btn-ghost btn-sm add-row-btn" id="fussball-add-ag">
          + Altersklasse hinzufügen
        </button>
      </div>

      <!-- Leistungsorientierung -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Leistungsorientierung <span class="form-required">*</span></h3>
        <div class="reg-form-grid">
          <div class="form-group form-group--full">
            <select class="form-input" id="fussball-competitive">
              <option value="">Bitte wählen</option>
              <option value="hochleistung">Hochleistung – Ligabetrieb, Kader, Sichtung</option>
              <option value="leistung">Leistungsorientiert – aktiver Ligabetrieb</option>
              <option value="beides">Beides – Freizeit &amp; Wettkampf</option>
              <option value="freizeit">Freizeitorientiert – kein Wettkampf</option>
            </select>
            <span class="form-field-error hidden" id="err-fussball-competitive">Angabe fehlt</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Besonderheiten <span class="form-optional">(optional)</span></label>
            <textarea class="form-input form-textarea" id="fussball-comp-extra" rows="2"
              placeholder="z.B. DFB-Nachwuchsleistungszentrum, Kooperation Profiverein, eigene Akademie ..."></textarea>
          </div>
        </div>
      </div>

      <!-- Training -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Trainingsangebot</h3>
        <div class="reg-form-grid">
          <div class="form-group">
            <label class="form-label">Trainingseinheiten / Woche <span class="form-required">*</span></label>
            <input type="number" class="form-input" id="fussball-sessions" placeholder="z.B. 3" min="1">
            <span class="form-field-error hidden" id="err-fussball-sessions">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Trainingsbeitrag (optional)</label>
            <input type="text" class="form-input" id="fussball-train-price"
              placeholder="z.B. im Mitgliedsbeitrag enthalten">
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">DFB-Lizenz im Training <span class="form-optional">(optional)</span></label>
            <input type="text" class="form-input" id="fussball-dfb"
              placeholder="z.B. 2 lizenzierte Trainer im Jugendbereich">
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Spezialisierung / Besondere Angebote <span class="form-optional">(optional)</span></label>
            <input type="text" class="form-input" id="fussball-special"
              placeholder="z.B. Torwartschule, Fußball-Feriencamp, Kooperation Schule ...">
          </div>
        </div>
      </div>

      <!-- Trainer -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Trainer <span class="form-optional">(optional)</span></h3>
        <div class="trainer-header-row"><span>Name</span><span>DFB-Lizenz / Ausbildung</span><span></span></div>
        <div id="fussball-tr-list"></div>
        <button type="button" class="btn btn-ghost btn-sm add-row-btn" id="fussball-add-tr">
          + Trainer hinzufügen
        </button>
      </div>
    `;

    _addAg();
    document.getElementById('fussball-add-ag').addEventListener('click', _addAg);
    document.getElementById('fussball-add-tr').addEventListener('click', _addTr);
  }

  function _addAg() {
    const i = _agIdx++;
    const agOpts = ALTERSKLASSEN.map(a => `<option value="${a}">${a}</option>`).join('');
    const ligaOpts = LIGEN.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('fussball-ag-list').insertAdjacentHTML('beforeend', `
      <div class="agegroup-row" id="fussball-ag-${i}">
        <select class="form-input" id="fussball-ag-k-${i}">
          <option value="">Wählen</option>${agOpts}
        </select>
        <select class="form-input" id="fussball-ag-l-${i}">
          <option value="">Liga</option>${ligaOpts}
        </select>
        <input type="text" class="form-input" id="fussball-ag-p-${i}" placeholder="Spieler (optional)">
        <button type="button" class="btn-remove-row" title="Entfernen"
          onclick="document.getElementById('fussball-ag-${i}').remove()">✕</button>
      </div>`);
  }

  function _addTr() {
    const i = _trIdx++;
    const lizOpts = LIZENZEN.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('fussball-tr-list').insertAdjacentHTML('beforeend', `
      <div class="trainer-row" id="fussball-tr-${i}">
        <input type="text" class="form-input" id="fussball-tr-n-${i}" placeholder="Name des Trainers">
        <select class="form-input" id="fussball-tr-l-${i}">${lizOpts}</select>
        <button type="button" class="btn-remove-row" title="Entfernen"
          onclick="document.getElementById('fussball-tr-${i}').remove()">✕</button>
      </div>`);
  }

  // ── Daten sammeln ────────────────────────────────────────────
  function getData() {
    const v = id => document.getElementById(id)?.value?.trim() || '';

    const agegroups = [];
    document.querySelectorAll('[id^="fussball-ag-"]:not([id$="-list"])').forEach(row => {
      if (!row.classList.contains('agegroup-row')) return;
      const i = row.id.replace('fussball-ag-', '');
      const k = document.getElementById(`fussball-ag-k-${i}`)?.value || '';
      if (k) agegroups.push({
        klasse:  k,
        liga:    document.getElementById(`fussball-ag-l-${i}`)?.value || '',
        spieler: document.getElementById(`fussball-ag-p-${i}`)?.value?.trim() || ''
      });
    });

    const trainers = [];
    document.querySelectorAll('[id^="fussball-tr-"]:not([id$="-list"])').forEach(row => {
      if (!row.classList.contains('trainer-row')) return;
      const i = row.id.replace('fussball-tr-', '');
      const n = document.getElementById(`fussball-tr-n-${i}`)?.value?.trim() || '';
      if (n) trainers.push({ name: n, lizenz: document.getElementById(`fussball-tr-l-${i}`)?.value || '' });
    });

    return {
      sport:          'fussball',
      fields:         v('fussball-fields'),
      format:         v('fussball-format'),
      fee:            v('fussball-fee'),
      agegroups,
      competitive:    v('fussball-competitive'),
      competitiveExtra: v('fussball-comp-extra'),
      trainingSessions: v('fussball-sessions'),
      trainingPrice:  v('fussball-train-price'),
      dfbLizenz:      v('fussball-dfb'),
      specialization: v('fussball-special'),
      trainers,
    };
  }

  // ── Validierung ──────────────────────────────────────────────
  function validate() {
    const required = [
      { id: 'fussball-fields',      errId: 'err-fussball-fields',      label: 'Anzahl Spielfelder' },
      { id: 'fussball-format',      errId: 'err-fussball-format',      label: 'Spielformat' },
      { id: 'fussball-competitive', errId: 'err-fussball-competitive', label: 'Leistungsorientierung (Fußball)' },
      { id: 'fussball-sessions',    errId: 'err-fussball-sessions',    label: 'Trainingseinheiten/Woche' },
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

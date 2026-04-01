/**
 * register-club-basketball.js
 * Basketball-spezifisches Vereinsformular.
 * Exportiert: BasketballForm.render(containerId), BasketballForm.getData(), BasketballForm.validate()
 */

const BasketballForm = (() => {

  const ALTERSKLASSEN = [
    'U8 (Minis)', 'U10', 'U12 (Schüler D)', 'U14 (Schüler B/C)',
    'U16 (Schüler A)', 'U18 (Jugend)', 'U20', 'Damen', 'Herren', 'Mixed'
  ];
  const LIGEN = [
    'Kreisliga', 'Bezirksliga', 'Landesliga Hessen', 'Hessenliga',
    'Regionalliga', '2. Bundesliga Pro B', 'Bundesliga (BBL/DBBL)', 'Keine Liga / intern'
  ];
  const LIZENZEN = [
    'Keine Lizenz', 'DBB C-Lizenz', 'DBB B-Lizenz', 'DBB A-Lizenz', 'Andere'
  ];

  let _agIdx = 0;
  let _trIdx = 0;

  // ── HTML bauen ──────────────────────────────────────────────
  function render(containerId) {
    const c = document.getElementById(containerId);
    if (!c) return;
    _agIdx = 0; _trIdx = 0;

    c.innerHTML = `
      <!-- Hallen & Beitrag -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Hallen &amp; Mitgliedschaft</h3>
        <div class="reg-form-grid">
          <div class="form-group">
            <label class="form-label">Anzahl Hallen <span class="form-required">*</span></label>
            <input type="number" class="form-input" id="basketball-halls" placeholder="z.B. 2" min="1">
            <span class="form-field-error hidden" id="err-basketball-halls">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">3×3-Basketball <span class="form-optional">(optional)</span></label>
            <select class="form-input" id="basketball-3x3">
              <option value="">Kein Angebot</option>
              <option value="ja">Ja – 3×3-Team vorhanden</option>
              <option value="training">Nur Trainingsbetrieb</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Mitgliedsbeitrag <span class="form-recommended">★ stark empfohlen</span></label>
            <input type="text" class="form-input" id="basketball-fee"
              placeholder="z.B. Erwachsene 150 €/Jahr · Jugend 80 €/Jahr · Minis kostenlos">
          </div>
        </div>
      </div>

      <!-- Altersklassen & Ligen -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Altersklassen &amp; Ligen <span class="form-recommended">★ stark empfohlen</span></h3>
        <p class="reg-section-hint">Alle Altersklassen eintragen, die im Verein aktiv sind. Gespielt wird standardmäßig 5-gegen-5. Liga und Spieleranzahl sind optional aber empfohlen.</p>
        <div class="agegroup-header-row">
          <span>Altersklasse</span><span>Liga</span><span>Spieler (optional)</span><span></span>
        </div>
        <div id="basketball-ag-list"></div>
        <button type="button" class="btn btn-ghost btn-sm add-row-btn" id="basketball-add-ag">
          + Altersklasse hinzufügen
        </button>
      </div>

      <!-- Leistungsorientierung -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Leistungsorientierung <span class="form-required">*</span></h3>
        <div class="reg-form-grid">
          <div class="form-group form-group--full">
            <select class="form-input" id="basketball-competitive">
              <option value="">Bitte wählen</option>
              <option value="hochleistung">Hochleistung – Ligabetrieb, Kader, Sichtung</option>
              <option value="leistung">Leistungsorientiert – aktiver Ligabetrieb</option>
              <option value="beides">Beides – Freizeit &amp; Wettkampf</option>
              <option value="freizeit">Freizeitorientiert – kein Wettkampf</option>
            </select>
            <span class="form-field-error hidden" id="err-basketball-competitive">Angabe fehlt</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Besonderheiten <span class="form-optional">(optional)</span></label>
            <textarea class="form-input form-textarea" id="basketball-comp-extra" rows="2"
              placeholder="z.B. DBB-Stützpunkt, Kooperation mit Profiverein, eigene Nachwuchsakademie ..."></textarea>
          </div>
        </div>
      </div>

      <!-- Training -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Trainingsangebot</h3>
        <div class="reg-form-grid">
          <div class="form-group">
            <label class="form-label">Gruppentraining – Preis <span class="form-required">*</span></label>
            <input type="text" class="form-input" id="basketball-grp-price"
              placeholder="z.B. im Mitgliedsbeitrag enthalten">
            <span class="form-field-error hidden" id="err-basketball-grp-price">Angabe fehlt</span>
          </div>
          <div class="form-group">
            <label class="form-label">Gruppentraining – Einheiten/Woche</label>
            <input type="number" class="form-input" id="basketball-grp-sessions" placeholder="z.B. 2" min="1">
          </div>
          <div class="form-group">
            <label class="form-label">Einzeltraining – Preis <span class="form-optional">(optional)</span></label>
            <input type="text" class="form-input" id="basketball-single-price" placeholder="z.B. 50 €/Stunde">
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Spezialisierung / Besondere Angebote <span class="form-optional">(optional)</span></label>
            <input type="text" class="form-input" id="basketball-special"
              placeholder="z.B. Fokus Jugend U14–U18, Basketballcamp, Sommer-Clinic ...">
          </div>
        </div>
      </div>

      <!-- Trainer -->
      <div class="reg-form-section">
        <h3 class="reg-section-title">Trainer <span class="form-optional">(optional)</span></h3>
        <div class="trainer-header-row"><span>Name</span><span>DBB-Lizenz / Ausbildung</span><span></span></div>
        <div id="basketball-tr-list"></div>
        <button type="button" class="btn btn-ghost btn-sm add-row-btn" id="basketball-add-tr">
          + Trainer hinzufügen
        </button>
      </div>
    `;

    _addAg();
    document.getElementById('basketball-add-ag').addEventListener('click', _addAg);
    document.getElementById('basketball-add-tr').addEventListener('click', _addTr);
  }

  function _addAg() {
    const i = _agIdx++;
    const agOpts = ALTERSKLASSEN.map(a => `<option value="${a}">${a}</option>`).join('');
    const ligaOpts = LIGEN.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('basketball-ag-list').insertAdjacentHTML('beforeend', `
      <div class="agegroup-row" id="basketball-ag-${i}">
        <select class="form-input" id="basketball-ag-k-${i}">
          <option value="">Wählen</option>${agOpts}
        </select>
        <select class="form-input" id="basketball-ag-l-${i}">
          <option value="">Liga</option>${ligaOpts}
        </select>
        <input type="text" class="form-input" id="basketball-ag-p-${i}" placeholder="Spieler (optional)">
        <button type="button" class="btn-remove-row" title="Entfernen"
          onclick="document.getElementById('basketball-ag-${i}').remove()">✕</button>
      </div>`);
  }

  function _addTr() {
    const i = _trIdx++;
    const lizOpts = LIZENZEN.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('basketball-tr-list').insertAdjacentHTML('beforeend', `
      <div class="trainer-row" id="basketball-tr-${i}">
        <input type="text" class="form-input" id="basketball-tr-n-${i}" placeholder="Name des Trainers">
        <select class="form-input" id="basketball-tr-l-${i}">${lizOpts}</select>
        <button type="button" class="btn-remove-row" title="Entfernen"
          onclick="document.getElementById('basketball-tr-${i}').remove()">✕</button>
      </div>`);
  }

  // ── Daten sammeln ────────────────────────────────────────────
  function getData() {
    const v = id => document.getElementById(id)?.value?.trim() || '';

    const agegroups = [];
    document.querySelectorAll('[id^="basketball-ag-"]:not([id$="-list"])').forEach(row => {
      if (!row.classList.contains('agegroup-row')) return;
      const i = row.id.replace('basketball-ag-', '');
      const k = document.getElementById(`basketball-ag-k-${i}`)?.value || '';
      if (k) agegroups.push({
        klasse:  k,
        liga:    document.getElementById(`basketball-ag-l-${i}`)?.value || '',
        spieler: document.getElementById(`basketball-ag-p-${i}`)?.value?.trim() || ''
      });
    });

    const trainers = [];
    document.querySelectorAll('[id^="basketball-tr-"]:not([id$="-list"])').forEach(row => {
      if (!row.classList.contains('trainer-row')) return;
      const i = row.id.replace('basketball-tr-', '');
      const n = document.getElementById(`basketball-tr-n-${i}`)?.value?.trim() || '';
      if (n) trainers.push({ name: n, lizenz: document.getElementById(`basketball-tr-l-${i}`)?.value || '' });
    });

    return {
      sport:           'basketball',
      halls:           v('basketball-halls'),
      basketball3x3:   v('basketball-3x3'),
      fee:             v('basketball-fee'),
      agegroups,
      competitive:     v('basketball-competitive'),
      competitiveExtra: v('basketball-comp-extra'),
      groupPrice:      v('basketball-grp-price'),
      groupSessions:   v('basketball-grp-sessions'),
      singlePrice:     v('basketball-single-price'),
      specialization:  v('basketball-special'),
      trainers,
    };
  }

  // ── Validierung ──────────────────────────────────────────────
  function validate() {
    const required = [
      { id: 'basketball-halls',       errId: 'err-basketball-halls',       label: 'Anzahl Hallen' },
      { id: 'basketball-competitive', errId: 'err-basketball-competitive', label: 'Leistungsorientierung (Basketball)' },
      { id: 'basketball-grp-price',   errId: 'err-basketball-grp-price',   label: 'Gruppentraining Preis (Basketball)' },
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

/**
 * views/admin-review.js
 * Admin page to approve or reject pending club/tournament submissions.
 * Protected: only accessible when logged in as the admin e-mail AND
 * after entering the correct admin password (stored as SHA-256 hash).
 */

const ADMIN_EMAIL   = 'timlober0@gmail.com';
const ADMIN_PW_KEY  = 'playor_admin_pw_hash'; // localStorage key for hash
const SESSION_KEY   = 'playor_admin_session';  // sessionStorage key

const AdminReviewView = (() => {

  // ---- stored params for after password entry ----
  let _pendingParams = null;

  function init() {
    const backBtn = document.getElementById('admin-review-back');
    if (backBtn) backBtn.addEventListener('click', () => Router.go('home'));
  }

  // ---- SHA-256 helper (Web Crypto API, built into all modern browsers) ----
  async function _sha256(text) {
    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ---- Password overlay -----------------------------------------------
  function _showPasswordOverlay(mode) {
    // mode: 'set' | 'enter' | 'change'
    const list    = document.getElementById('admin-pending-list');
    const empty   = document.getElementById('admin-empty');
    const sub     = document.getElementById('admin-review-sub');
    if (list)  list.innerHTML  = '';
    if (empty) empty.classList.add('hidden');

    const title = mode === 'set'
      ? 'Admin-Passwort festlegen'
      : mode === 'change'
        ? 'Neues Admin-Passwort festlegen'
        : 'Admin-Passwort eingeben';

    const hint = mode === 'set'
      ? 'Du öffnest das Admin-Panel zum ersten Mal. Lege jetzt ein sicheres Passwort fest.'
      : mode === 'change'
        ? 'Gib zuerst dein altes Passwort ein, dann das neue.'
        : 'Gib das Admin-Passwort ein um fortzufahren.';

    if (sub) sub.textContent = title;

    const html = mode === 'change' ? `
      <div class="admin-pw-overlay" id="admin-pw-overlay">
        <div class="admin-pw-box">
          <h3>${title}</h3>
          <p class="admin-pw-hint">${hint}</p>
          <div class="form-group">
            <label>Altes Passwort</label>
            <input type="password" id="admin-pw-old" class="form-input" placeholder="Altes Passwort" autocomplete="current-password">
          </div>
          <div class="form-group">
            <label>Neues Passwort</label>
            <input type="password" id="admin-pw-new" class="form-input" placeholder="Neues Passwort (min. 6 Zeichen)" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label>Neues Passwort bestätigen</label>
            <input type="password" id="admin-pw-confirm" class="form-input" placeholder="Wiederholen" autocomplete="new-password">
          </div>
          <p class="form-error hidden" id="admin-pw-error"></p>
          <div style="display:flex;gap:0.75rem;margin-top:1rem;">
            <button class="btn btn-primary" id="admin-pw-submit">Passwort ändern</button>
            <button class="btn btn-ghost" id="admin-pw-cancel">Abbrechen</button>
          </div>
        </div>
      </div>` : `
      <div class="admin-pw-overlay" id="admin-pw-overlay">
        <div class="admin-pw-box">
          <h3>${title}</h3>
          <p class="admin-pw-hint">${hint}</p>
          <div class="form-group">
            <input type="password" id="admin-pw-input" class="form-input" placeholder="Passwort eingeben" autocomplete="${mode === 'set' ? 'new-password' : 'current-password'}">
          </div>
          ${mode === 'set' ? `
          <div class="form-group">
            <input type="password" id="admin-pw-confirm" class="form-input" placeholder="Passwort bestätigen" autocomplete="new-password">
          </div>` : ''}
          <p class="form-error hidden" id="admin-pw-error"></p>
          <button class="btn btn-primary" id="admin-pw-submit" style="margin-top:0.5rem;">${mode === 'set' ? 'Passwort festlegen' : 'Einloggen'}</button>
        </div>
      </div>`;

    if (list) list.innerHTML = html;

    // Focus first input
    setTimeout(() => {
      const first = document.getElementById('admin-pw-old') || document.getElementById('admin-pw-input');
      if (first) first.focus();
    }, 50);

    // Allow Enter key to submit
    document.getElementById('admin-pw-overlay').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('admin-pw-submit')?.click();
    });

    document.getElementById('admin-pw-submit').addEventListener('click', async () => {
      const errEl = document.getElementById('admin-pw-error');
      errEl.classList.add('hidden');

      if (mode === 'set') {
        const pw  = document.getElementById('admin-pw-input').value;
        const pw2 = document.getElementById('admin-pw-confirm').value;
        if (pw.length < 6) { errEl.textContent = 'Mindestens 6 Zeichen.'; errEl.classList.remove('hidden'); return; }
        if (pw !== pw2)    { errEl.textContent = 'Passwörter stimmen nicht überein.'; errEl.classList.remove('hidden'); return; }
        const hash = await _sha256(pw);
        localStorage.setItem(ADMIN_PW_KEY, hash);
        sessionStorage.setItem(SESSION_KEY, '1');
        Toast.show('Admin-Passwort wurde festgelegt!', 'success');
        _renderList();

      } else if (mode === 'enter') {
        const pw   = document.getElementById('admin-pw-input').value;
        const hash = await _sha256(pw);
        if (hash !== localStorage.getItem(ADMIN_PW_KEY)) {
          errEl.textContent = 'Falsches Passwort.';
          errEl.classList.remove('hidden');
          document.getElementById('admin-pw-input').value = '';
          document.getElementById('admin-pw-input').focus();
          return;
        }
        sessionStorage.setItem(SESSION_KEY, '1');
        _renderList(_pendingParams);

      } else if (mode === 'change') {
        const oldPw  = document.getElementById('admin-pw-old').value;
        const newPw  = document.getElementById('admin-pw-new').value;
        const newPw2 = document.getElementById('admin-pw-confirm').value;
        const oldHash = await _sha256(oldPw);
        if (oldHash !== localStorage.getItem(ADMIN_PW_KEY)) {
          errEl.textContent = 'Altes Passwort ist falsch.'; errEl.classList.remove('hidden'); return;
        }
        if (newPw.length < 6) { errEl.textContent = 'Neues Passwort: mindestens 6 Zeichen.'; errEl.classList.remove('hidden'); return; }
        if (newPw !== newPw2)  { errEl.textContent = 'Passwörter stimmen nicht überein.'; errEl.classList.remove('hidden'); return; }
        const newHash = await _sha256(newPw);
        localStorage.setItem(ADMIN_PW_KEY, newHash);
        Toast.show('Passwort erfolgreich geändert!', 'success');
        _renderList();
      }
    });

    // Cancel button (change mode only)
    const cancelBtn = document.getElementById('admin-pw-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => _renderList());
  }

  /** Called by routeChange handler whenever this view becomes active. */
  function render(params) {
    // --- Zugriffsschutz 1: E-Mail ---
    const user = Auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      Toast.show('Zugriff verweigert. Nur für Administratoren.', 'error', 4000);
      Router.go('home');
      return;
    }

    _pendingParams = params;

    // --- Zugriffsschutz 2: Passwort ---
    const storedHash = localStorage.getItem(ADMIN_PW_KEY);
    const hasSession = sessionStorage.getItem(SESSION_KEY);

    if (!storedHash) {
      // First time: let admin set a password
      _showPasswordOverlay('set');
      return;
    }

    if (!hasSession) {
      // Password is set but not yet entered this browser session
      _showPasswordOverlay('enter');
      return;
    }

    // All checks passed
    _renderList(params);
  }

  function _renderList(params) {
    const list  = document.getElementById('admin-pending-list');
    const empty = document.getElementById('admin-empty');
    const sub   = document.getElementById('admin-review-sub');
    if (!list) return;

    const items = SubmissionStore.getAll();
    const pending = items.filter(s => s.status === 'pending');

    sub.textContent = `${pending.length} ausstehend · ${items.length} gesamt`;

    // If a token was passed in the URL, pre-scroll to it
    if (params && params.token) {
      setTimeout(() => {
        const el = document.querySelector(`[data-token="${params.token}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }

    if (items.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');

    list.innerHTML = items.map(item => {
      const isPending = item.status === 'pending';
      const isApproved = item.status === 'approved';
      const typeLabel = item.type === 'verein' ? 'Verein' : 'Turnier';
      const sportMap = { tennis: 'Tennis', fussball: 'Fußball', basketball: 'Basketball' };
      const statusClass = isPending ? 'pending' : (isApproved ? 'approved' : 'rejected');
      const statusLabel = isPending ? 'Ausstehend' : (isApproved ? 'Genehmigt' : 'Abgelehnt');

      const extras = [
        item.founded     && `Gegründet: ${item.founded}`,
        item.members     && `Mitglieder: ${item.members}`,
        item.courts      && `Plätze: ${item.courts}`,
        item.costs       && `Kosten: ${item.costs}`,
        item.competitive && `Leistungsorientiert: ${item.competitive}`,
        item.ageGroups   && `Altersklassen: ${item.ageGroups}`,
        item.leagues     && `Ligen: ${item.leagues}`,
        item.date        && `Datum: ${item.date}`,
        item.deadline    && `Anmeldeschluss: ${item.deadline}`,
        item.participants && `Teilnehmer: ${item.participants}`,
        item.phone       && `Tel.: ${item.phone}`,
        item.website     && `Web: ${item.website}`,
        item.contactName && `Ansprechpartner: ${item.contactName}`,
      ].filter(Boolean).join(' · ');

      return `
        <div class="admin-card admin-card--${statusClass}" data-token="${item.token}">
          <div class="admin-card-header">
            <span class="admin-card-type">${typeLabel}</span>
            <span class="admin-card-sport">${sportMap[item.sport] || item.sport}</span>
            <span class="admin-card-status admin-status--${statusClass}">${statusLabel}</span>
            <span class="admin-card-date">${new Date(item.createdAt).toLocaleDateString('de-DE')}</span>
          </div>
          <div class="admin-card-name">${_esc(item.name)}</div>
          <div class="admin-card-address">${_esc(item.address)}</div>
          <div class="admin-card-desc">${_esc(item.description)}</div>
          ${extras ? `<div class="admin-card-extras">${_esc(extras)}</div>` : ''}
          <div class="admin-card-contact">
            Kontakt: <strong>${_esc(item.contactEmail)}</strong>
          </div>
          ${isPending ? `
          <div class="admin-card-actions">
            <button class="btn btn-primary btn-sm admin-approve-btn" data-token="${item.token}">Genehmigen &amp; hinzufügen</button>
            <button class="btn btn-danger btn-sm admin-reject-btn" data-token="${item.token}">Ablehnen &amp; löschen</button>
          </div>` : ''}
        </div>
      `;
    }).join('');

    // Bind approve/reject buttons
    list.querySelectorAll('.admin-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => _approve(btn.dataset.token));
    });
    list.querySelectorAll('.admin-reject-btn').forEach(btn => {
      btn.addEventListener('click', () => _reject(btn.dataset.token));
    });

    // "Passwort ändern" footer link
    const pwChangeBtn = document.createElement('button');
    pwChangeBtn.className = 'btn btn-ghost btn-sm';
    pwChangeBtn.style.cssText = 'margin-top:2rem;display:block;';
    pwChangeBtn.textContent = 'Admin-Passwort ändern';
    pwChangeBtn.addEventListener('click', () => _showPasswordOverlay('change'));
    list.appendChild(pwChangeBtn);
  }

  function _approve(token) {
    const entry = SubmissionStore.approve(token);
    if (!entry) return;

    // Convert submission to a DEMO_CLUBS-compatible entry and push it
    const newClub = _submissionToClub(entry);
    DEMO_CLUBS.push(newClub);

    Toast.show(`"${entry.name}" wurde genehmigt und zu den Ergebnissen hinzugefügt!`, 'success', 5000);
    _renderList();
  }

  function _reject(token) {
    const entry = SubmissionStore.getByToken(token);
    if (!entry) return;
    SubmissionStore.reject(token);
    Toast.show(`"${entry.name}" wurde abgelehnt und gelöscht.`, 'success');
    _renderList();
  }
  function _submissionToClub(entry) {
    const sportImgs = {
      tennis:     'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
      fussball:   'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80',
      basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80',
    };

    const ageGroups = entry.ageGroups
      ? entry.ageGroups.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    return {
      id:          'user_' + entry.token,
      sport:       entry.sport || 'fussball',
      type:        entry.type,
      name:        entry.name,
      address:     entry.address,
      lat:         50.055,  // default: Heusenstamm (no geocoding in demo)
      lng:         8.801,
      members:     entry.members ? parseInt(entry.members) || null : null,
      courts:      entry.courts  ? parseInt(entry.courts)  || null : null,
      founded:     entry.founded || null,
      date:        entry.date    || null,
      participants:entry.participants ? parseInt(entry.participants) || null : null,
      phone:       entry.phone   || null,
      website:     entry.website || null,
      description: entry.description,
      image:       sportImgs[entry.sport] || sportImgs.fussball,
      ageGroups,
    };
  }

  function _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  return { init, render };
})();

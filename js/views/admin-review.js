/**
 * views/admin-review.js
 * Admin page to approve or reject pending club/tournament submissions.
 *
 * Access: navigate to #admin-review in the URL, or click the link in
 * the confirmation email (token is read from URL params automatically).
 *
 * This is a simple, password-free admin view suitable for a
 * non-commercial demo project. Do not use this pattern in production.
 */

const AdminReviewView = (() => {

  function init() {
    const backBtn = document.getElementById('admin-review-back');
    if (backBtn) backBtn.addEventListener('click', () => Router.go('home'));
  }

  /** Called by routeChange handler whenever this view becomes active. */
  function render(params) {
    _renderList();

    // If a token was passed in the URL (e.g. from email link), pre-scroll to it
    if (params && params.token) {
      setTimeout(() => {
        const el = document.querySelector(`[data-token="${params.token}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }

  function _renderList() {
    const list  = document.getElementById('admin-pending-list');
    const empty = document.getElementById('admin-empty');
    const sub   = document.getElementById('admin-review-sub');
    if (!list) return;

    const items = SubmissionStore.getAll();
    const pending = items.filter(s => s.status === 'pending');

    sub.textContent = `${pending.length} ausstehend · ${items.length} gesamt`;

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

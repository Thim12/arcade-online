/**
 * views/register-club.js
 * Handles the Verein and Turnier registration forms.
 */

const RegisterClubView = (() => {

  function init() {
    _bindVereinForm();
    _bindTurnierForm();
    _bindBackButtons();
  }

  // ---- Back buttons -----------------------------------------
  function _bindBackButtons() {
    const vBack = document.getElementById('register-verein-back');
    const tBack = document.getElementById('register-turnier-back');
    if (vBack) vBack.addEventListener('click', () => Router.go('home'));
    if (tBack) tBack.addEventListener('click', () => Router.go('home'));
  }

  // ---- Verein form ------------------------------------------
  function _bindVereinForm() {
    const form = document.getElementById('register-verein-form');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      _setSubmitting(true, 'rv');

      const data = {
        type:         'verein',
        name:         _val('rv-name'),
        sport:        _val('rv-sport'),
        address:      _val('rv-address'),
        founded:      _val('rv-founded'),
        members:      _val('rv-members'),
        courts:       _val('rv-courts'),
        costs:        _val('rv-costs'),
        competitive:  _val('rv-competitive'),
        ageGroups:    _val('rv-agegroups'),
        leagues:      _val('rv-leagues'),
        description:  _val('rv-description'),
        website:      _val('rv-website'),
        phone:        _val('rv-phone'),
        contactEmail: _val('rv-email'),
        contactName:  _val('rv-contact-name'),
      };

      // Validate required fields
      const missing = _checkRequired(data, ['name', 'sport', 'address', 'description', 'contactEmail']);
      if (missing) {
        _showError('rv-error', missing);
        _setSubmitting(false, 'rv');
        return;
      }

      const result = await sendSubmission(data);
      _setSubmitting(false, 'rv');

      if (result.ok) {
        form.reset();
        Toast.show('Dein Verein wurde eingereicht! Wir melden uns.', 'success', 5000);
        Router.go('home');
      } else {
        _showError('rv-error', result.error || 'Fehler beim Absenden. Bitte erneut versuchen.');
      }
    });
  }

  // ---- Turnier form -----------------------------------------
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

  // ---- Helpers ----------------------------------------------
  function _val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _checkRequired(data, keys) {
    for (const k of keys) {
      if (!data[k]) return `Pflichtfeld fehlt: ${_fieldLabel(k)}`;
    }
    return null;
  }

  function _fieldLabel(key) {
    const map = {
      name:         'Name',
      sport:        'Sportart',
      address:      'Standort/Adresse',
      date:         'Datum',
      description:  'Beschreibung',
      contactEmail: 'Kontakt-E-Mail',
    };
    return map[key] || key;
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

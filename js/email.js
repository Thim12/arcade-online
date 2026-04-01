/**
 * email.js – Submission store + EmailJS integration
 *
 * In demo mode (no EmailJS keys) submissions are stored in
 * localStorage under 'sm_pending_clubs'.
 *
 * To enable real email sending:
 *   1. Create a free account at https://emailjs.com
 *   2. Add a service (Gmail), create an email template, note IDs
 *   3. Fill in EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY below
 *   4. Add the EmailJS CDN in Sport.html (see comment in script section)
 *
 * Template variables (use these in the EmailJS template):
 *   {{type}}         – "Verein" or "Turnier"
 *   {{name}}         – club/tournament name
 *   {{sport}}        – sport
 *   {{address}}      – location/address
 *   {{description}}  – description text
 *   {{contact_email}}– contact email
 *   {{extras}}       – all other fields as key: value pairs
 *   {{approve_url}}  – link to approve this submission
 *   {{token}}        – submission token (same as in approve_url)
 */

const EMAILJS_SERVICE_ID  = 'service_f026ugd';
const EMAILJS_TEMPLATE_ID = 'template_fuzc914';
const EMAILJS_PUBLIC_KEY  = 'q6AP2ocScTzgMrsvY';
const ADMIN_EMAIL         = 'timlober0@gmail.com';

const EMAIL_MODE = !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

const SubmissionStore = (() => {
  const LS_KEY = 'sm_pending_clubs';

  function _load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch { return []; }
  }

  function _save(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  /** Add a new pending submission. Returns the generated token. */
  function add(data) {
    const token = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const entry = { ...data, token, status: 'pending', createdAt: new Date().toISOString() };
    const items = _load();
    items.push(entry);
    _save(items);
    return token;
  }

  /** Get all pending (not yet approved/rejected) submissions. */
  function getPending() {
    return _load().filter(s => s.status === 'pending');
  }

  /** Get all submissions (for admin overview). */
  function getAll() {
    return _load();
  }

  /** Find by token. */
  function getByToken(token) {
    return _load().find(s => s.token === token) || null;
  }

  /** Approve a submission by token. Returns the entry or null. */
  function approve(token) {
    const items = _load();
    const idx = items.findIndex(s => s.token === token);
    if (idx === -1) return null;
    items[idx].status = 'approved';
    _save(items);
    return items[idx];
  }

  /** Reject/delete a submission by token. */
  function reject(token) {
    const items = _load().filter(s => s.token !== token);
    _save(items);
  }

  return { add, getPending, getAll, getByToken, approve, reject };
})();

/**
 * Send a club/tournament registration submission.
 * Saves to local store and optionally sends via EmailJS.
 *
 * @param {object} data  – form data (type, name, sport, address, …)
 * @returns {Promise<{ok: boolean, token: string, error?: string}>}
 */
async function sendSubmission(data) {
  const token = SubmissionStore.add(data);

  if (!EMAIL_MODE) {
    // Demo mode: just store locally
    console.info('[Playor Sports] Demo-Modus: Eintrag lokal gespeichert. Token:', token);
    return { ok: true, token };
  }

  // Build approve URL (current origin + hash)
  const approveUrl = window.location.origin + window.location.pathname + '#admin-review?token=' + token;

  // Build extras string
  const skip = new Set(['type', 'name', 'sport', 'address', 'description', 'contactEmail']);
  const extras = Object.entries(data)
    .filter(([k]) => !skip.has(k))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const templateParams = {
    to_email:      ADMIN_EMAIL,
    type:          data.type === 'verein' ? 'Verein' : 'Turnier',
    name:          data.name,
    sport:         data.sport,
    address:       data.address,
    description:   data.description,
    contact_email: data.contactEmail,
    extras,
    approve_url:   approveUrl,
    token,
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    return { ok: true, token };
  } catch (err) {
    console.error('[EmailJS] Fehler:', err);
    // Still saved locally — partial success
    return { ok: true, token, warning: 'E-Mail konnte nicht gesendet werden, Eintrag wurde lokal gespeichert.' };
  }
}

/**
 * data.js – Mock users, demo clubs, demo tournaments, badges
 * Used as fallback / demo content when no Supabase is configured.
 */

/* ============================================================
   MOCK USERS – leer, alle echten Nutzer kommen aus Supabase
   ============================================================ */
const MOCK_USERS = [];

/* ============================================================
   DEMO CLUBS & TOURNAMENTS – leer, alle echten Daten kommen aus Supabase
   ============================================================ */
const DEMO_CLUBS = [];

/* ============================================================
   BADGES – Achievable badges
   ============================================================ */
const ALL_BADGES = [
  { id: 'first_match',   icon: '🏅', name: 'Erstes Spiel',      desc: 'Dein erstes Match gespielt',      condition: u => u.matches >= 1 },
  { id: 'win5',          icon: '⭐', name: '5 Siege',           desc: '5 Siege errungen',                condition: u => u.wins >= 5 },
  { id: 'win20',         icon: '🌟', name: '20 Siege',          desc: '20 Siege erreicht',               condition: u => u.wins >= 20 },
  { id: 'train10',       icon: '💪', name: 'Trainingsprofi',    desc: '10 Trainingseinheiten',           condition: u => u.trainings >= 10 },
  { id: 'train50',       icon: '🔥', name: 'Ausdauer',          desc: '50 Trainingseinheiten',           condition: u => u.trainings >= 50 },
  { id: 'social1',       icon: '🤝', name: 'Vernetzt',          desc: 'Ersten Spieler gefolgt',          condition: u => (u.following || []).length >= 1 },
  { id: 'social5',       icon: '👥', name: 'Community-Star',    desc: '5 Spielern gefolgt',              condition: u => (u.following || []).length >= 5 },
  { id: 'xp1000',        icon: '🏆', name: 'Aufsteiger',        desc: '1000 XP gesammelt',               condition: u => u.xp >= 1000 },
  { id: 'xp5000',        icon: '👑', name: 'Legende',           desc: '5000 XP gesammelt',               condition: u => u.xp >= 5000 },
  { id: 'profile_done',  icon: '✅', name: 'Profil komplett',   desc: 'Profil vollständig ausgefüllt',   condition: u => u.bio && u.location },
];

/**
 * Get earned + locked badges for a user.
 */
function getBadges(user) {
  return ALL_BADGES.map(b => ({
    ...b,
    earned: b.condition(user),
  }));
}

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Calculate level from XP.
 * @returns { level: number, label: string, current: number, next: number }
 */
function getLevel(xp) {
  const tiers = [
    { level: 1, label: 'Rookie',       min: 0    },
    { level: 2, label: 'Einsteiger',   min: 500  },
    { level: 3, label: 'Aktiver',      min: 1200 },
    { level: 4, label: 'Veteran',      min: 2500 },
    { level: 5, label: 'Elite',        min: 5000 },
    { level: 6, label: 'Legende',      min: 9000 },
  ];
  let tier = tiers[0];
  for (const t of tiers) {
    if (xp >= t.min) tier = t;
  }
  const idx   = tiers.indexOf(tier);
  const next  = tiers[idx + 1];
  const current = xp - tier.min;
  const range   = next ? next.min - tier.min : 1;
  const pct     = Math.min(100, Math.round((current / range) * 100));
  return { ...tier, pct, nextMin: next ? next.min : tier.min, xp };
}

/**
 * Sport emoji helper.
 */
function sportEmoji(sport) {
  const map = { tennis: '🎾', fussball: '⚽', basketball: '🏀' };
  return map[sport] || '🏅';
}

/**
 * Sport label helper.
 */
function sportLabel(sport) {
  const map = { tennis: 'Tennis', fussball: 'Fußball', basketball: 'Basketball' };
  return map[sport] || sport;
}

/**
 * Distance between two lat/lng pairs (km, Haversine).
 */
function distance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format ISO date to German locale.
 */
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Age group options (shared constant). */
const AGE_GROUPS = ['U12', 'U14', 'U16', 'U18', 'Erwachsene', 'Ü35', 'Ü50'];

/**
 * auth.js – Login, Registration, Session management
 * Nutzt Supabase wenn SUPABASE_URL + SUPABASE_ANON gesetzt sind,
 * sonst localStorage-Demo-Modus.
 */

const Auth = (() => {
  // ---- State ---------------------------------------------------
  let _currentUser = null;
  const _listeners = [];

  // ---- Helpers (localStorage – Demo-Modus) ---------------------
  const LS_USERS_KEY   = 'sm_users';
  const LS_SESSION_KEY = 'sm_session';

  function _getUsers() {
    try { return JSON.parse(localStorage.getItem(LS_USERS_KEY)) || []; }
    catch { return []; }
  }
  function _saveUsers(users) {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  }
  function _saveSession(user) {
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(user));
  }
  function _clearSession() {
    localStorage.removeItem(LS_SESSION_KEY);
  }
  function _loadSession() {
    try { return JSON.parse(localStorage.getItem(LS_SESSION_KEY)); }
    catch { return null; }
  }

  function _notify(user) {
    _currentUser = user;
    _listeners.forEach(fn => fn(user));
  }

  // ---- Supabase helpers ----------------------------------------

  /** Lädt das Profil eines eingeloggten Supabase-Users aus der profiles-Tabelle */
  async function _loadSupabaseProfile(sbUser) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sbUser.id)
      .single();
    if (error || !data) return null;
    return { ...data, email: sbUser.email };
  }

  // ---- Public API ----------------------------------------------

  /**
   * Initialisierung – Session wiederherstellen.
   * Bei Supabase: Auth-State-Listener registrieren.
   * Bei Demo-Modus: aus localStorage laden.
   */
  async function init() {
    if (!DEMO_MODE) {
      await initSupabase();
      if (!supabase) { _demoInit(); return; }

      // Supabase Auth-State-Änderungen abonnieren
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await _loadSupabaseProfile(session.user);
          _notify(profile || { id: session.user.id, email: session.user.email, name: session.user.email });
        } else {
          _notify(null);
        }
      });

      // Aktuelle Session prüfen
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await _loadSupabaseProfile(session.user);
        _notify(profile || { id: session.user.id, email: session.user.email, name: session.user.email });
      }
    } else {
      _demoInit();
    }
  }

  function _demoInit() {
    const stored = _loadSession();
    if (stored) {
      const users = _getUsers();
      const fresh = users.find(u => u.id === stored.id) || stored;
      _notify(fresh);
    }
  }

  /**
   * Auth-State-Listener registrieren.
   */
  function onAuthChange(fn) {
    _listeners.push(fn);
    fn(_currentUser);
  }

  function getUser() { return _currentUser; }
  function isLoggedIn() { return !!_currentUser; }

  /**
   * Registrierung – Supabase oder Demo-Modus.
   */
  async function register({ name, email, password, sport, location, ageGroup, gender }) {
    if (!name || !email || !password) return { ok: false, error: 'Alle Felder ausfüllen.' };
    if (password.length < 8) return { ok: false, error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' };

    if (!DEMO_MODE && supabase) {
      // --- Supabase ---
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        // Supabase gibt bei doppelter E-Mail einen bestimmten Fehler zurück
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          return { ok: false, error: 'Mit dieser E-Mail existiert bereits ein Konto.' };
        }
        return { ok: false, error: error.message };
      }

      const userId = data.user?.id;
      if (userId) {
        await supabase.from('profiles').insert({
          id:          userId,
          name:        name.trim(),
          sport:       sport || 'fussball',
          location:    location || 'Hessen',
          bio:         '',
          xp:          0,
          matches:     0,
          wins:        0,
          trainings:   0,
          club_status: 'suche',
          gender:      gender || '',
        });
      }
      return { ok: true, user: data.user };
    } else {
      // --- Demo-Modus ---
      const users = _getUsers();
      if (users.find(u => u.email === email)) {
        return { ok: false, error: 'E-Mail ist bereits vergeben.' };
      }
      const user = {
        id:         'u_' + Date.now(),
        name:       name.trim(),
        email:      email.toLowerCase().trim(),
        password,
        sport:      sport || 'fussball',
        location:   location || 'Hessen',
        ageGroup:   ageGroup || '',
        gender:     gender || '',
        bio:        '',
        xp:         0,
        level:      'anfanger',
        clubStatus: 'suche',
        matches:    0,
        wins:       0,
        trainings:  0,
        following:  [],
        followers:  [],
        createdAt:  new Date().toISOString(),
        isNew:      true,
      };
      users.push(user);
      _saveUsers(users);
      _saveSession(user);
      _notify(user);
      return { ok: true, user };
    }
  }

  /**
   * Login – Supabase oder Demo-Modus.
   */
  async function login({ email, password }) {
    if (!email || !password) return { ok: false, error: 'E-Mail und Passwort eingeben.' };

    if (!DEMO_MODE && supabase) {
      // --- Supabase ---
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: 'E-Mail oder Passwort falsch.' };
      const profile = await _loadSupabaseProfile(data.user);
      _notify(profile || { id: data.user.id, email: data.user.email, name: data.user.email });
      return { ok: true, user: _currentUser };
    } else {
      // --- Demo-Modus ---
      const users = _getUsers();
      const user = users.find(u => u.email === email.toLowerCase().trim());
      if (!user) return { ok: false, error: 'Kein Konto mit dieser E-Mail gefunden.' };
      if (user.password !== password) return { ok: false, error: 'Falsches Passwort.' };
      _saveSession(user);
      _notify(user);
      return { ok: true, user };
    }
  }

  /**
   * Logout.
   */
  async function logout() {
    if (!DEMO_MODE && supabase) {
      await supabase.auth.signOut();
    } else {
      _clearSession();
    }
    _notify(null);
  }

  /**
   * Profil aktualisieren.
   */
  async function updateProfile(updates) {
    if (!_currentUser) return;

    if (!DEMO_MODE && supabase) {
      await supabase.from('profiles').update(updates).eq('id', _currentUser.id);
      _notify({ ..._currentUser, ...updates });
    } else {
      const users = _getUsers();
      const idx = users.findIndex(u => u.id === _currentUser.id);
      if (idx === -1) return;
      const updated = { ...users[idx], ...updates };
      users[idx] = updated;
      _saveUsers(users);
      _saveSession(updated);
      _notify(updated);
    }
  }

  /**
   * Onboarding abschließen.
   */
  function finishOnboarding(data) {
    updateProfile({ ...data, isNew: false });
  }

  /**
   * XP hinzufügen.
   */
  function addXP(amount) {
    if (!_currentUser) return;
    const xp = (_currentUser.xp || 0) + amount;
    updateProfile({ xp });
    return xp;
  }

  /**
   * Folgen / Entfolgen.
   */
  async function toggleFollow(targetId) {
    if (!_currentUser) return false;

    if (!DEMO_MODE && supabase) {
      const { data: existing } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', _currentUser.id)
        .eq('following_id', targetId)
        .single();

      if (existing) {
        await supabase.from('follows').delete()
          .eq('follower_id', _currentUser.id).eq('following_id', targetId);
        return false;
      } else {
        await supabase.from('follows').insert({ follower_id: _currentUser.id, following_id: targetId });
        return true;
      }
    } else {
      const users = _getUsers();
      const me = users.find(u => u.id === _currentUser.id);
      const target = users.find(u => u.id === targetId);
      if (!me || !target) return false;
      const already = me.following.includes(targetId);
      if (already) {
        me.following = me.following.filter(id => id !== targetId);
        target.followers = target.followers.filter(id => id !== me.id);
      } else {
        me.following.push(targetId);
        target.followers.push(me.id);
      }
      _saveUsers(users);
      _saveSession(me);
      _notify(me);
      return !already;
    }
  }

  /**
   * Nachricht senden.
   */
  async function sendMessage(toId, body) {
    if (!_currentUser || !body.trim()) return null;

    if (!DEMO_MODE && supabase) {
      const { data } = await supabase.from('messages').insert({
        from_id: _currentUser.id,
        to_id:   toId,
        body:    body.trim(),
      }).select().single();
      return data;
    } else {
      const key = 'sm_messages';
      const msgs = JSON.parse(localStorage.getItem(key) || '[]');
      const msg = { id: 'm_' + Date.now(), fromId: _currentUser.id, toId, body: body.trim(), createdAt: new Date().toISOString() };
      msgs.push(msg);
      localStorage.setItem(key, JSON.stringify(msgs));
      return msg;
    }
  }

  /**
   * Nachrichten zwischen zwei Nutzern laden.
   */
  async function getMessages(withId) {
    if (!_currentUser) return [];

    if (!DEMO_MODE && supabase) {
      const { data } = await supabase.from('messages')
        .select('*')
        .or(`and(from_id.eq.${_currentUser.id},to_id.eq.${withId}),and(from_id.eq.${withId},to_id.eq.${_currentUser.id})`)
        .order('created_at', { ascending: true });
      return (data || []).map(m => ({ ...m, fromId: m.from_id, toId: m.to_id, createdAt: m.created_at }));
    } else {
      const key = 'sm_messages';
      const msgs = JSON.parse(localStorage.getItem(key) || '[]');
      return msgs.filter(m =>
        (m.fromId === _currentUser.id && m.toId === withId) ||
        (m.fromId === withId && m.toId === _currentUser.id)
      ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
  }

  /**
   * Alle Chat-Partner laden.
   */
  async function getChatPartners() {
    if (!_currentUser) return [];

    if (!DEMO_MODE && supabase) {
      const { data } = await supabase.from('messages')
        .select('from_id, to_id')
        .or(`from_id.eq.${_currentUser.id},to_id.eq.${_currentUser.id}`);
      const partnerIds = new Set();
      (data || []).forEach(m => {
        if (m.from_id === _currentUser.id) partnerIds.add(m.to_id);
        if (m.to_id   === _currentUser.id) partnerIds.add(m.from_id);
      });
      if (!partnerIds.size) return [];
      const { data: profiles } = await supabase.from('profiles')
        .select('*').in('id', [...partnerIds]);
      return profiles || [];
    } else {
      const key = 'sm_messages';
      const msgs = JSON.parse(localStorage.getItem(key) || '[]');
      const partnerIds = new Set();
      msgs.forEach(m => {
        if (m.fromId === _currentUser.id) partnerIds.add(m.toId);
        if (m.toId   === _currentUser.id) partnerIds.add(m.fromId);
      });
      const users = _getUsers();
      return [...partnerIds].map(id => users.find(u => u.id === id)).filter(Boolean);
    }
  }

  /**
   * Alle Nutzer laden (für Social-View).
   */
  async function getAllUsers() {
    if (!DEMO_MODE && supabase) {
      const { data } = await supabase.from('profiles').select('*').order('xp', { ascending: false });
      return data || [];
    } else {
      return _getUsers();
    }
  }

  /**
   * Konto dauerhaft löschen.
   */
  async function deleteAccount() {
    if (!_currentUser) return;
    const id = _currentUser.id;

    if (!DEMO_MODE && supabase) {
      await supabase.from('messages').delete().or(`from_id.eq.${id},to_id.eq.${id}`);
      await supabase.from('follows').delete().or(`follower_id.eq.${id},following_id.eq.${id}`);
      await supabase.from('profiles').delete().eq('id', id);
      await supabase.auth.signOut();
    } else {
      const users = _getUsers().filter(u => u.id !== id);
      _saveUsers(users);
      const msgKey = 'sm_messages';
      const msgs = JSON.parse(localStorage.getItem(msgKey) || '[]')
        .filter(m => m.fromId !== id && m.toId !== id);
      localStorage.setItem(msgKey, JSON.stringify(msgs));
      _clearSession();
    }
    _notify(null);
  }

  /**
   * Get count of unread messages (messages received after last chat open).
   * Uses a localStorage timestamp per partner to track read state.
   */
  function getUnreadCount() {
    if (!_currentUser) return 0;
    const key = 'sm_messages';
    const readKey = 'sm_read_ts_' + _currentUser.id;
    const msgs = JSON.parse(localStorage.getItem(key) || '[]');
    const readTs = JSON.parse(localStorage.getItem(readKey) || '{}');
    let count = 0;
    msgs.forEach(m => {
      if (m.toId === _currentUser.id) {
        const lastRead = readTs[m.fromId] || '0';
        if (m.createdAt > lastRead) count++;
      }
    });
    return count;
  }

  /**
   * Mark all messages from a partner as read.
   */
  function markRead(partnerId) {
    if (!_currentUser) return;
    const readKey = 'sm_read_ts_' + _currentUser.id;
    const readTs = JSON.parse(localStorage.getItem(readKey) || '{}');
    readTs[partnerId] = new Date().toISOString();
    localStorage.setItem(readKey, JSON.stringify(readTs));
  }

  return {
    init,
    onAuthChange,
    getUser,
    isLoggedIn,
    register,
    login,
    logout,
    updateProfile,
    finishOnboarding,
    addXP,
    toggleFollow,
    sendMessage,
    getMessages,
    getChatPartners,
    getAllUsers,
    deleteAccount,
    getUnreadCount,
    markRead,
  };
})();

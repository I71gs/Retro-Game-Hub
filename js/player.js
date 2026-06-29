/**
 * RETRO GAME HUB — player.js
 * Player profiles, coins, leaderboard — all via LocalStorage
 */

const PlayerDB = (() => {
  const STORE_KEY = 'retrohub_players';
  const SESSION_KEY = 'retrohub_session';
  const SETTINGS_KEY = 'retrohub_settings';

  const AVATARS = ['🎮','👾','🕹️','🤖','👻','👽','🦊','🐸','🐼','🦁','🐯','🐺','🦄','🔥','⚡','💎','🌟','🏆','🎯','🚀','🍄','🧊','💀','🐲'];

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch { return {}; }
  }

  function save(db) {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
  }

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch { return {}; }
  }

  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  function hashPin(pin) {
    // simple non-crypto hash (fine for casual game)
    let h = 0;
    for (let i = 0; i < pin.length; i++) h = ((h << 5) - h) + pin.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function setSession(player) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(player));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function createPlayer(id, pin, avatar) {
    const db = load();
    id = id.trim().toUpperCase();
    if (!id || id.length < 3) return { ok: false, msg: 'ID must be 3+ characters' };
    if (!/^[A-Z0-9_-]+$/.test(id)) return { ok: false, msg: 'Only letters, numbers, _ and -' };
    if (db[id]) return { ok: false, msg: 'Player ID already taken!' };
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) return { ok: false, msg: 'PIN must be 4 digits' };

    const player = {
      id,
      avatar: avatar || '🎮',
      pin: hashPin(pin),
      coins: 0,
      wins: { total: 0, dots: 0, ttt: 0, snl: 0, bs: 0, c4: 0, hangman: 0, memory: 0, tetris: 0, pong: 0 },
      games: { total: 0, dots: 0, ttt: 0, snl: 0, bs: 0, c4: 0, hangman: 0, memory: 0, tetris: 0, pong: 0 },
      streak: 0,
      created: Date.now(),
      lastSeen: Date.now(),
    };
    db[id] = player;
    save(db);
    setSession(player);
    return { ok: true, player };
  }

  function loginPlayer(id, pin) {
    const db = load();
    id = id.trim().toUpperCase();
    const p = db[id];
    if (!p) return { ok: false, msg: 'Player not found' };
    if (p.pin !== hashPin(pin)) return { ok: false, msg: 'Wrong PIN' };
    p.lastSeen = Date.now();
    save(db);
    setSession(p);
    return { ok: true, player: p };
  }

  function getCurrentPlayer() {
    return getSession();
  }

  function updatePlayer(updates) {
    const session = getSession();
    if (!session) return;
    const db = load();
    const p = db[session.id];
    if (!p) return;
    Object.assign(p, updates);
    db[session.id] = p;
    save(db);
    setSession(p);
    return p;
  }

  function awardCoins(amount, game) {
    const session = getSession();
    if (!session || session.id === 'GUEST') return;
    const db = load();
    const p = db[session.id];
    if (!p) return;
    p.coins += amount;
    p.wins.total++;
    if (game && p.wins[game] !== undefined) p.wins[game]++;
    p.streak = (p.streak || 0) + 1;
    // streak bonus
    if (p.streak % 3 === 0) p.coins += 5;
    db[session.id] = p;
    save(db);
    setSession(p);
    return p;
  }

  function recordGame(game, won) {
    const session = getSession();
    if (!session || session.id === 'GUEST') return;
    const db = load();
    const p = db[session.id];
    if (!p) return;
    p.games.total = (p.games.total || 0) + 1;
    if (game && p.games[game] !== undefined) p.games[game]++;
    if (!won) p.streak = 0;
    // participation coins
    p.coins += 2;
    db[session.id] = p;
    save(db);
    setSession(p);
  }

  function getLeaderboard(game) {
    const db = load();
    let players = Object.values(db);
    if (game && game !== 'all') {
      players.sort((a, b) => (b.wins[game] || 0) - (a.wins[game] || 0));
    } else {
      players.sort((a, b) => (b.coins || 0) - (a.coins || 0));
    }
    return players.slice(0, 20);
  }

  function deletePlayer(id) {
    const db = load();
    delete db[id];
    save(db);
    clearSession();
  }

  function guestPlayer() {
    const g = {
      id: 'GUEST',
      avatar: '👾',
      coins: 0,
      wins: { total: 0, dots: 0, ttt: 0, snl: 0, bs: 0, c4: 0, hangman: 0, memory: 0, tetris: 0, pong: 0 },
      games: { total: 0, dots: 0, ttt: 0, snl: 0, bs: 0, c4: 0, hangman: 0, memory: 0, tetris: 0, pong: 0 },
      streak: 0,
    };
    setSession(g);
    return g;
  }

  function logout() {
    clearSession();
  }

  function getAvatars() { return AVATARS; }

  function getSettings() { return loadSettings(); }
  function saveSetting(key, val) {
    const s = loadSettings();
    s[key] = val;
    saveSettings(s);
  }

  return {
    createPlayer, loginPlayer, getCurrentPlayer,
    updatePlayer, awardCoins, recordGame,
    getLeaderboard, deletePlayer, guestPlayer,
    logout, getAvatars, getSettings, saveSetting,
  };
})();

window.PlayerDB = PlayerDB;

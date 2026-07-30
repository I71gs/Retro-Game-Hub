import { create } from 'zustand';
import type { Player, WinRecord } from '../types';
import { EMPTY_WIN_RECORD } from '../types';

const STORE_KEY = 'retrohub_v2_players';
const SESSION_KEY = 'retrohub_v2_session';

function hashPin(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) - h) + pin.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function loadDB(): Record<string, Player> {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
  catch { return {}; }
}

function saveDB(db: Record<string, Player>) {
  localStorage.setItem(STORE_KEY, JSON.stringify(db));
}

function xpForLevel(level: number): number {
  return level * 500;
}

interface PlayerState {
  currentPlayer: Player | null;
  // Actions
  register: (id: string, pin: string, avatar: string) => { ok: boolean; msg?: string };
  login: (id: string, pin: string) => { ok: boolean; msg?: string };
  loginGuest: () => void;
  logout: () => void;
  awardCoins: (amount: number, game: keyof WinRecord) => void;
  recordGame: (game: keyof WinRecord, won: boolean) => void;
  deleteCurrentPlayer: () => void;
  getLeaderboard: (game: string) => Player[];
  refreshFromDB: () => void;
}

export const AVATARS = [
  '🎮','👾','🕹️','🤖','👻','👽','🦊','🐸','🐼','🦁',
  '🐯','🐺','🦄','🔥','⚡','💎','🌟','🏆','🎯','🚀',
  '🍄','🧊','💀','🐲',
];

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  currentPlayer: (() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  })(),

  register(id, pin, avatar) {
    const db = loadDB();
    id = id.trim().toUpperCase();
    if (!id || id.length < 3) return { ok: false, msg: 'ID must be 3+ characters' };
    if (!/^[A-Z0-9_-]+$/.test(id)) return { ok: false, msg: 'Only letters, numbers, _ and -' };
    if (db[id]) return { ok: false, msg: 'Player ID already taken!' };
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) return { ok: false, msg: 'PIN must be 4 digits' };

    const player: Player = {
      id, avatar: avatar || '🎮',
      pin: hashPin(pin),
      coins: 0, xp: 0, level: 1,
      wins: EMPTY_WIN_RECORD(),
      games: EMPTY_WIN_RECORD(),
      streak: 0,
      created: Date.now(),
      lastSeen: Date.now(),
    };
    db[id] = player;
    saveDB(db);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(player));
    set({ currentPlayer: player });
    return { ok: true };
  },

  login(id, pin) {
    const db = loadDB();
    id = id.trim().toUpperCase();
    const p = db[id];
    if (!p) return { ok: false, msg: 'Player not found' };
    if (p.pin !== hashPin(pin)) return { ok: false, msg: 'Wrong PIN' };
    p.lastSeen = Date.now();
    db[id] = p;
    saveDB(db);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
    set({ currentPlayer: p });
    return { ok: true };
  },

  loginGuest() {
    const guest: Player = {
      id: 'GUEST', avatar: '👾',
      coins: 0, xp: 0, level: 1,
      wins: EMPTY_WIN_RECORD(),
      games: EMPTY_WIN_RECORD(),
      streak: 0,
      created: Date.now(),
      lastSeen: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(guest));
    set({ currentPlayer: guest });
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    set({ currentPlayer: null });
  },

  awardCoins(amount, game) {
    const { currentPlayer } = get();
    if (!currentPlayer || currentPlayer.id === 'GUEST') return;
    const db = loadDB();
    const p = db[currentPlayer.id];
    if (!p) return;

    p.coins += amount;
    p.wins.total++;
    if (game !== 'total' && p.wins[game] !== undefined) p.wins[game]++;
    p.streak = (p.streak || 0) + 1;
    if (p.streak % 3 === 0) p.coins += 5; // streak bonus

    // XP award
    p.xp = (p.xp || 0) + 100;
    while (p.xp >= xpForLevel(p.level)) {
      p.xp -= xpForLevel(p.level);
      p.level++;
    }

    db[currentPlayer.id] = p;
    saveDB(db);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
    set({ currentPlayer: { ...p } });
  },

  recordGame(game, won) {
    const { currentPlayer } = get();
    if (!currentPlayer || currentPlayer.id === 'GUEST') return;
    const db = loadDB();
    const p = db[currentPlayer.id];
    if (!p) return;

    p.games.total = (p.games.total || 0) + 1;
    if (game !== 'total' && p.games[game] !== undefined) p.games[game]++;
    if (!won) p.streak = 0;

    // Participation XP
    p.xp = (p.xp || 0) + 20;
    p.coins += 2;

    db[currentPlayer.id] = p;
    saveDB(db);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
    set({ currentPlayer: { ...p } });
  },

  deleteCurrentPlayer() {
    const { currentPlayer } = get();
    if (!currentPlayer || currentPlayer.id === 'GUEST') return;
    const db = loadDB();
    delete db[currentPlayer.id];
    saveDB(db);
    sessionStorage.removeItem(SESSION_KEY);
    set({ currentPlayer: null });
  },

  getLeaderboard(game: string): Player[] {
    const db = loadDB();
    const players = Object.values(db).filter(p => !p.id.startsWith('GUEST'));
    if (game && game !== 'all') {
      const g = game as keyof WinRecord;
      players.sort((a, b) => ((b.wins[g] as number) || 0) - ((a.wins[g] as number) || 0));
    } else {
      players.sort((a, b) => (b.coins || 0) - (a.coins || 0));
    }
    return players.slice(0, 20);
  },

  refreshFromDB() {
    const { currentPlayer } = get();
    if (!currentPlayer || currentPlayer.id === 'GUEST') return;
    const db = loadDB();
    const p = db[currentPlayer.id];
    if (p) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
      set({ currentPlayer: { ...p } });
    }
  },
}));

// Seed demo data on first run
export function seedDemoData() {
  const db = loadDB();
  if (Object.keys(db).length > 0) return;

  const demos = [
    { id: 'PIXELKING',  avatar: '👾', coins: 420, xp: 2200, level: 5, wTotal: 28, wDots: 12, wTtt: 10, wSnl: 6 },
    { id: 'RETROQUEEN', avatar: '👻', coins: 380, xp: 1800, level: 4, wTotal: 22, wDots: 8,  wTtt: 9,  wSnl: 5 },
    { id: 'GAMER99',    avatar: '🎮', coins: 290, xp: 1300, level: 3, wTotal: 18, wDots: 5,  wTtt: 7,  wSnl: 6 },
    { id: 'DOTMASTER',  avatar: '🔥', coins: 210, xp: 900,  level: 2, wTotal: 14, wDots: 10, wTtt: 2,  wSnl: 2 },
    { id: 'SNAKEKING',  avatar: '🐲', coins: 175, xp: 750,  level: 2, wTotal: 11, wDots: 1,  wTtt: 3,  wSnl: 7 },
  ];

  demos.forEach(d => {
    const wins = EMPTY_WIN_RECORD();
    wins.total = d.wTotal; wins.dots = d.wDots; wins.ttt = d.wTtt; wins.snl = d.wSnl;
    const games = { ...wins };
    games.total += 5;

    const p: Player = {
      id: d.id, avatar: d.avatar, pin: hashPin('0000'),
      coins: d.coins, xp: d.xp, level: d.level,
      wins, games, streak: 0,
      created: Date.now() - Math.random() * 1e10,
      lastSeen: Date.now() - Math.random() * 1e8,
    };
    db[d.id] = p;
  });
  saveDB(db);
}

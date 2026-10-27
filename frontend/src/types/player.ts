export interface WinRecord {
  total: number;
  dots: number;
  ttt: number;
  snl: number;
  bs: number;
  c4: number;
  hangman: number;
  memory: number;
  tetris: number;
  pong: number;
  snake: number;
  game2048: number;
  breakout: number;
  minesweeper: number;
  simon: number;
}

export interface Player {
  id: string;
  avatar: string;
  pin?: string;
  coins: number;
  xp: number;
  level: number;
  wins: WinRecord;
  games: WinRecord;
  streak: number;
  created: number;
  lastSeen: number;
}

export interface Settings {
  theme: 'default' | 'notebook' | 'gameboy' | 'neon';
  scanlines: boolean;
  vignette: boolean;
  pixelFont: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'default',
  scanlines: true,
  vignette: true,
  pixelFont: true,
  soundEnabled: true,
  musicEnabled: false,
};

export const EMPTY_WIN_RECORD = (): WinRecord => ({
  total: 0, dots: 0, ttt: 0, snl: 0, bs: 0,
  c4: 0, hangman: 0, memory: 0, tetris: 0, pong: 0,
  snake: 0, game2048: 0, breakout: 0, minesweeper: 0, simon: 0,
});

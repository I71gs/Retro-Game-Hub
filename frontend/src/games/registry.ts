import type { ComponentType } from 'react';
import type { GameMeta, GameConfig } from '../types';
import { TicTacToe } from './tictactoe/TicTacToe';
import { ConnectFour } from './connectfour/ConnectFour';
import { DotsGame } from './dots/DotsGame';
import { SnakesLadders } from './snl/SnakesLadders';
import { Battleship } from './battleship/Battleship';
import { Hangman } from './hangman/Hangman';
import { MemoryMatch } from './memory/MemoryMatch';
import { Tetris } from './tetris/Tetris';
import { Pong } from './pong/Pong';
import { Snake } from './snake/Snake';
import { Game2048 } from './game2048/Game2048';
import { Breakout } from './breakout/Breakout';
import { Minesweeper } from './minesweeper/Minesweeper';
import { SimonSays } from './simonsays/SimonSays';

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: 'ttt',
    name: 'TIC-TAC-TOE',
    description: 'Three in a row to claim glory',
    coinsPerWin: 10,
    supportsAI: true,
    supportsOnline: false,
    previewType: 'ttt',
  },
  {
    id: 'c4',
    name: 'CONNECT FOUR',
    description: 'Drop discs, get 4 in a row',
    coinsPerWin: 12,
    supportsAI: true,
    supportsOnline: false,
    previewType: 'c4',
  },
  {
    id: 'dots',
    name: 'DOTS & BOXES',
    description: 'Claim territory, outsmart your rival',
    coinsPerWin: 15,
    supportsAI: true,
    supportsOnline: false,
    previewType: 'dots',
  },
  {
    id: 'snl',
    name: 'SNAKES & LADDERS',
    description: 'Luck, laughter, and lucky ladders',
    coinsPerWin: 20,
    supportsAI: true,
    supportsOnline: false,
    previewType: 'snl',
  },
  {
    id: 'bs',
    name: 'BATTLESHIP',
    description: 'Place your fleet, hunt the enemy',
    coinsPerWin: 25,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'bs',
  },
  {
    id: 'hangman',
    name: 'HANGMAN',
    description: 'Guess the word before it\'s too late',
    coinsPerWin: 14,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'hangman',
  },
  {
    id: 'memory',
    name: 'MEMORY MATCH',
    description: 'Flip cards, find the pairs',
    coinsPerWin: 16,
    supportsAI: true,
    supportsOnline: false,
    previewType: 'memory',
  },
  {
    id: 'tetris',
    name: 'TETRIS',
    description: 'Stack blocks, clear lines',
    coinsPerWin: 20,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'tetris',
  },
  {
    id: 'pong',
    name: 'PONG',
    description: 'Classic paddle battle vs AI',
    coinsPerWin: 12,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'pong',
  },
  {
    id: 'snake',
    name: 'SNAKE',
    description: 'Slither, devour apples, grow without crashing',
    coinsPerWin: 15,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'snake',
  },
  {
    id: 'game2048',
    name: '2048',
    description: 'Slide and merge numbers to reach 2048',
    coinsPerWin: 25,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'game2048',
  },
  {
    id: 'breakout',
    name: 'BREAKOUT',
    description: 'Smash through brick walls with precision rebounds',
    coinsPerWin: 20,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'breakout',
  },
  {
    id: 'minesweeper',
    name: 'MINESWEEPER',
    description: 'Uncover safe terrain, flag bombs, test deduction',
    coinsPerWin: 18,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'minesweeper',
  },
  {
    id: 'simon',
    name: 'SIMON SAYS',
    description: 'Remember and repeat the flashing tone sequence',
    coinsPerWin: 20,
    supportsAI: false,
    supportsOnline: false,
    previewType: 'simon',
  },
];

export const GAME_COMPONENTS: Record<string, ComponentType<{ config: GameConfig }>> = {
  ttt: TicTacToe,
  c4: ConnectFour,
  dots: DotsGame,
  snl: SnakesLadders,
  bs: Battleship,
  hangman: Hangman,
  memory: MemoryMatch,
  tetris: Tetris,
  pong: Pong,
  snake: Snake,
  game2048: Game2048,
  breakout: Breakout,
  minesweeper: Minesweeper,
  simon: SimonSays,
};

export const GAME_TRACKS: Record<string, string> = {
  ttt: 'ttt',
  c4: 'dots',
  dots: 'dots',
  snl: 'snl',
  bs: 'ttt',
  hangman: 'hangman',
  memory: 'memory',
  tetris: 'tetris',
  pong: 'pong',
  snake: 'snl',
  game2048: 'dots',
  breakout: 'pong',
  minesweeper: 'ttt',
  simon: 'memory',
};

import { create } from 'zustand';

interface GameState {
  currentGameId: string | null;
  vsAI: boolean;
  online: boolean;
  playerIndex: 1 | 2;
  currentTrack: string | null;
  setCurrentGame: (id: string | null) => void;
  setVsAI: (v: boolean) => void;
  setOnline: (v: boolean) => void;
  setPlayerIndex: (i: 1 | 2) => void;
  setCurrentTrack: (t: string | null) => void;
}

export const useGameStore = create<GameState>()((set) => ({
  currentGameId: null,
  vsAI: false,
  online: false,
  playerIndex: 1,
  currentTrack: null,
  setCurrentGame: (id) => set({ currentGameId: id }),
  setVsAI: (vsAI) => set({ vsAI }),
  setOnline: (online) => set({ online }),
  setPlayerIndex: (playerIndex) => set({ playerIndex }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
}));

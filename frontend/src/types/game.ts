// Game interface — every game component implements this contract
export interface GameConfig {
  p1Name: string;
  p2Name: string;
  vsAI: boolean;
  online: boolean;
  playerIndex: 1 | 2;
  onWin: (winner: string, coins: number | null) => void;
  onDraw: () => void;
}

export interface GameMeta {
  id: string;
  name: string;
  description: string;
  coinsPerWin: number;
  supportsAI: boolean;
  supportsOnline: boolean;
  previewType: string;
}

// Minimax AI for Tic-Tac-Toe

const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

export function checkWinner(b: (string|null)[]): { winner: string; line?: number[] } | null {
  for (const [a, c, d] of WINS) {
    if (b[a] && b[a] === b[c] && b[a] === b[d])
      return { winner: b[a]!, line: [a, c, d] };
  }
  if (b.every(Boolean)) return { winner: 'draw' };
  return null;
}

function minimax(b: (string|null)[], depth: number, isMax: boolean): number {
  const r = checkWinner(b);
  if (r) {
    if (r.winner === 'O') return 10 - depth;
    if (r.winner === 'X') return depth - 10;
    return 0;
  }
  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = isMax ? 'O' : 'X';
    const score = minimax(b, depth + 1, !isMax);
    b[i] = null;
    best = isMax ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

export function getBestMove(board: (string|null)[]): number {
  let best = -Infinity, move = -1;
  const b = [...board];
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = 'O';
    const s = minimax(b, 0, false);
    b[i] = null;
    if (s > best) { best = s; move = i; }
  }
  return move;
}

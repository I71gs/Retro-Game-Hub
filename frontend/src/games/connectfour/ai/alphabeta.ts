// Alpha-Beta Pruning AI for Connect Four
export const ROWS = 6;
export const COLS = 7;

export function checkWinner(board: (number|null)[][]): { winner: number; cells: [number,number][] } | null {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const v = board[r][c];
      if (v && v === board[r][c+1] && v === board[r][c+2] && v === board[r][c+3])
        return { winner: v, cells: [[r,c],[r,c+1],[r,c+2],[r,c+3]] };
    }
  }
  // Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v && v === board[r+1][c] && v === board[r+2][c] && v === board[r+3][c])
        return { winner: v, cells: [[r,c],[r+1,c],[r+2,c],[r+3,c]] };
    }
  }
  // Diagonal /
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const v = board[r][c];
      if (v && v === board[r-1][c+1] && v === board[r-2][c+2] && v === board[r-3][c+3])
        return { winner: v, cells: [[r,c],[r-1,c+1],[r-2,c+2],[r-3,c+3]] };
    }
  }
  // Diagonal \
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const v = board[r][c];
      if (v && v === board[r+1][c+1] && v === board[r+2][c+2] && v === board[r+3][c+3])
        return { winner: v, cells: [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]] };
    }
  }
  if (board[0].every((_, c) => board.some(row => row[c] !== null)))
    return { winner: 0, cells: [] }; // draw
  return null;
}

export function getOpenRow(board: (number|null)[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) return r;
  }
  return -1;
}

function scoreWindow(window: (number|null)[], piece: number): number {
  const opp = piece === 2 ? 1 : 2;
  const count = window.filter(x => x === piece).length;
  const empty = window.filter(x => x === null).length;
  const oppCount = window.filter(x => x === opp).length;
  if (count === 4) return 100;
  if (count === 3 && empty === 1) return 5;
  if (count === 2 && empty === 2) return 2;
  if (oppCount === 3 && empty === 1) return -4;
  return 0;
}

function scoreBoard(board: (number|null)[][], piece: number): number {
  let score = 0;
  const center = Math.floor(COLS / 2);
  const centerCol = board.map(r => r[center]);
  score += centerCol.filter(x => x === piece).length * 3;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS - 3; c++)
      score += scoreWindow([board[r][c],board[r][c+1],board[r][c+2],board[r][c+3]], piece);
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS - 3; r++)
      score += scoreWindow([board[r][c],board[r+1][c],board[r+2][c],board[r+3][c]], piece);
  for (let r = 3; r < ROWS; r++)
    for (let c = 0; c < COLS - 3; c++)
      score += scoreWindow([board[r][c],board[r-1][c+1],board[r-2][c+2],board[r-3][c+3]], piece);
  for (let r = 0; r < ROWS - 3; r++)
    for (let c = 0; c < COLS - 3; c++)
      score += scoreWindow([board[r][c],board[r+1][c+1],board[r+2][c+2],board[r+3][c+3]], piece);
  return score;
}

function alphabeta(
  board: (number|null)[][], depth: number, alpha: number, beta: number, maximizing: boolean
): [number, number] {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === 2) return [-1, 100000 + depth];
    if (result.winner === 1) return [-1, -100000 - depth];
    return [-1, 0];
  }
  if (depth === 0) return [-1, scoreBoard(board, 2)];

  const validCols = Array.from({length: COLS}, (_, i) => i).filter(c => board[0][c] === null);
  if (validCols.length === 0) return [-1, 0];

  let bestCol = validCols[Math.floor(validCols.length / 2)];
  if (maximizing) {
    let value = -Infinity;
    for (const col of validCols) {
      const r = getOpenRow(board, col);
      const nb = board.map(row => [...row]);
      nb[r][col] = 2;
      const [, s] = alphabeta(nb, depth - 1, alpha, beta, false);
      if (s > value) { value = s; bestCol = col; }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  } else {
    let value = Infinity;
    for (const col of validCols) {
      const r = getOpenRow(board, col);
      const nb = board.map(row => [...row]);
      nb[r][col] = 1;
      const [, s] = alphabeta(nb, depth - 1, alpha, beta, true);
      if (s < value) { value = s; bestCol = col; }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  }
}

export function getBestMove(board: (number|null)[][]): number {
  const [col] = alphabeta(board, 5, -Infinity, Infinity, true);
  return col;
}

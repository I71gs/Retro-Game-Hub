import { useState, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { checkWinner, getBestMove, getOpenRow, ROWS, COLS } from './ai/alphabeta';

function makeEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null) as (number|null)[]);
}

export function ConnectFour({ config }: { config: GameConfig }) {
  const { p1Name, p2Name, vsAI, onWin, onDraw } = config;
  const [board, setBoard] = useState<(number|null)[][]>(makeEmptyBoard);
  const [current, setCurrent] = useState<1|2>(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [winCells, setWinCells] = useState<[number,number][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [dropping, setDropping] = useState<number>(-1);
  const ended = useRef(false);

  const doEnd = useCallback((result: { winner: number; cells: [number,number][] }) => {
    if (ended.current) return;
    ended.current = true;
    setGameOver(true);
    setWinCells(result.cells);
    if (result.winner === 0) {
      setTimeout(() => onDraw(), 600);
    } else {
      const name = result.winner === 1 ? p1Name : p2Name;
      setScores(prev => ({ ...prev, [result.winner]: prev[result.winner as 1|2] + 1 }));
      setTimeout(() => onWin(name, result.winner === 1 ? 12 : null), 700);
    }
  }, [p1Name, p2Name, onWin, onDraw]);

  const dropDisc = useCallback((col: number, b: (number|null)[][], player: 1|2) => {
    const r = getOpenRow(b, col);
    if (r === -1) return;
    const nb = b.map(row => [...row]);
    nb[r][col] = player;
    setBoard(nb);
    setDropping(col);
    AudioManager.play('drop');
    setTimeout(() => setDropping(-1), 350);

    const result = checkWinner(nb);
    if (result) { doEnd(result); return nb; }

    const next: 1|2 = player === 1 ? 2 : 1;
    setCurrent(next);
    if (vsAI && next === 2) {
      setTimeout(() => {
        const aiCol = getBestMove(nb);
        if (aiCol !== -1) dropDisc(aiCol, nb, 2);
      }, 500);
    }
    return nb;
  }, [vsAI, doEnd]);

  function handleDrop(col: number) {
    if (gameOver || board[0][col] !== null) return;
    if (vsAI && current === 2) return;
    dropDisc(col, board, current);
  }

  const isWinCell = (r: number, c: number) => winCells.some(([wr, wc]) => wr === r && wc === c);

  return (
    <div className="c4-board-container">
      {/* Scores */}
      <div className="flex gap-8 font-pixel" style={{ fontSize: '0.6rem' }}>
        <span style={{ color: 'var(--p1)' }}>{p1Name}: {scores[1]}</span>
        <span style={{ color: 'var(--p2)' }}>{p2Name}: {scores[2]}</span>
      </div>

      {/* Drop buttons */}
      <div className="c4-drop-indicators">
        {Array.from({ length: COLS }, (_, c) => (
          <button key={c} className="c4-drop-btn" onClick={() => handleDrop(c)}
            disabled={gameOver || board[0][c] !== null}
            style={{ color: current === 1 ? 'var(--p1)' : 'var(--p2)' }}>
            ▼
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="c4-board">
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const val = board[r][c];
            return (
              <div
                key={`${r}-${c}`}
                className={`c4-cell${val ? ` p${val}` : ''}${isWinCell(r, c) ? ' win' : ''}${dropping === c && r === 0 ? ' drop' : ''}`}
                onClick={() => handleDrop(c)}
              />
            );
          })
        )}
      </div>

      {/* Status */}
      <div className="c4-status" style={{ color: current === 1 ? 'var(--p1)' : 'var(--p2)' }}>
        {gameOver
          ? winCells.length ? `${current === 1 ? p2Name : p1Name} WINS!` : 'DRAW!'
          : `${current === 1 ? p1Name : p2Name}'s turn`}
      </div>
    </div>
  );
}

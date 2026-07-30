import { useState, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { checkWinner, getOpenRow, getBestMove, ROWS, COLS } from './ai/alphabeta';
import { AudioManager } from '../../services/AudioManager';

export function ConnectFour({ config }: { config: GameConfig }) {
  const { p1Name, p2Name, vsAI, onWin, onDraw } = config;

  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null) as (number | null)[]);

  const [board, setBoard] = useState<(number | null)[][]>(emptyBoard());
  const [current, setCurrent] = useState<1 | 2>(1);
  const [dropping, setDropping] = useState<number>(-1);
  const [gameOver, setGameOver] = useState(false);
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const ended = useRef(false);

  const doEnd = useCallback((result: { winner: number; cells: [number, number][] }) => {
    if (ended.current) return;
    ended.current = true;
    setWinCells(result.cells);
    setGameOver(true);
    if (result.winner === 0) {
      setTimeout(() => onDraw(), 700);
    } else {
      const winnerName = result.winner === 1 ? p1Name : (vsAI ? 'CPU' : p2Name);
      setScores(prev => ({ ...prev, [result.winner]: prev[result.winner as 1 | 2] + 1 }));
      setTimeout(() => onWin(winnerName, 12), 700);
    }
  }, [ended, p1Name, p2Name, vsAI, onWin, onDraw]);

  function handleDrop(col: number) {
    if (gameOver || current !== 1 || ended.current) return;
    const r = getOpenRow(board, col);
    if (r < 0) return;

    const nb = board.map(row => [...row]);
    nb[r][col] = 1;
    setBoard(nb);
    setDropping(col);
    AudioManager.play('move');
    setTimeout(() => setDropping(-1), 350);

    const result = checkWinner(nb);
    if (result) { doEnd(result); return nb; }

    setCurrent(2);

    if (vsAI) {
      setTimeout(() => {
        const aiCol = getBestMove(nb);
        const ar = getOpenRow(nb, aiCol);
        if (ar < 0) return;
        const nb2 = nb.map(row => [...row]);
        nb2[ar][aiCol] = 2;
        setBoard(nb2);
        setDropping(aiCol);
        AudioManager.play('move');
        setTimeout(() => setDropping(-1), 350);
        const r2 = checkWinner(nb2);
        if (r2) { doEnd(r2); return; }
        setCurrent(1);
      }, 500);
    } else {
      setCurrent(2);
    }
  }

  function handleHumanDrop(col: number) {
    if (gameOver || ended.current) return;
    if (vsAI && current !== 1) return;
    const r = getOpenRow(board, col);
    if (r < 0) return;

    const nb = board.map(row => [...row]);
    nb[r][col] = current;
    setBoard(nb);
    setDropping(col);
    AudioManager.play('move');
    setTimeout(() => setDropping(-1), 350);

    const result = checkWinner(nb);
    if (result) { doEnd(result); return; }

    const next: 1 | 2 = current === 1 ? 2 : 1;
    setCurrent(next);

    if (vsAI && next === 2) {
      setTimeout(() => {
        const aiCol = getBestMove(nb);
        const ar = getOpenRow(nb, aiCol);
        if (ar < 0) return;
        const nb2 = nb.map(row => [...row]);
        nb2[ar][aiCol] = 2;
        setBoard(nb2);
        setDropping(aiCol);
        AudioManager.play('move');
        setTimeout(() => setDropping(-1), 350);
        const r2 = checkWinner(nb2);
        if (r2) { doEnd(r2); return; }
        setCurrent(1);
      }, 500);
    }
  }

  const isWinCell = (r: number, c: number) => winCells.some(([wr, wc]) => wr === r && wc === c);

  const PLAYER_COLORS = ['', 'var(--p1)', 'var(--p2)'];
  const PLAYER_NAMES = ['', p1Name, vsAI ? '🤖 CPU' : p2Name];
  const PLAYER_EMOJI = ['', '🟣', '🔴'];

  return (
    <div className="c4-board-container">
      {/* Scoreboard */}
      <div className="game-scorebar">
        <div className={`game-score-chip p1${current === 1 && !gameOver ? ' anim-glow' : ''}`}
          style={{ outline: current === 1 && !gameOver ? '2px solid var(--p1)' : 'none' }}>
          {PLAYER_EMOJI[1]} {p1Name} — {scores[1]}
        </div>
        <div className={`game-score-chip p2${current === 2 && !gameOver ? ' anim-glow' : ''}`}
          style={{ outline: current === 2 && !gameOver ? '2px solid var(--p2)' : 'none' }}>
          {PLAYER_EMOJI[2]} {PLAYER_NAMES[2]} — {scores[2]}
        </div>
      </div>

      {/* Column drop buttons */}
      <div className="c4-drop-indicators">
        {Array.from({ length: COLS }, (_, c) => (
          <button
            key={c}
            className="c4-drop-btn"
            onClick={() => handleHumanDrop(c)}
            disabled={gameOver || (vsAI && current === 2)}
            title={`Drop in column ${c + 1}`}
          >
            ▼
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="c4-board">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={[
                'c4-cell',
                cell === 1 ? 'p1' : '',
                cell === 2 ? 'p2' : '',
                isWinCell(r, c) ? 'win' : '',
                dropping === c && cell ? 'drop' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !cell && r === getOpenRow(board, c) ? handleHumanDrop(c) : undefined}
            />
          ))
        )}
      </div>

      {/* Status */}
      <div className="c4-status">
        {gameOver
          ? winCells.length === 0
            ? "🤝 IT'S A DRAW!"
            : <span style={{ color: PLAYER_COLORS[current === 1 ? 2 : 1] }}>
                🏆 {PLAYER_NAMES[current === 1 ? 2 : 1]} WINS!
              </span>
          : <span style={{ color: PLAYER_COLORS[current] }}>
              {PLAYER_NAMES[current]}'s turn
            </span>}
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { checkWinner, getBestMove } from './ai/minimax';

export function TicTacToe({ config }: { config: GameConfig }) {
  const [board, setBoard] = useState<(string|null)[]>(Array(9).fill(null));
  const [current, setCurrent] = useState<'X'|'O'>('X');
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winLine, setWinLine] = useState<number[]>([]);
  const [popped, setPopped] = useState<number>(-1);
  const [ended, setEnded] = useState(false);

  const { p1Name, p2Name, vsAI, onWin, onDraw } = config;

  const doEnd = useCallback((result: { winner: string; line?: number[] }) => {
    if (ended) return;
    setEnded(true);
    setGameOver(true);
    if (result.line) setWinLine(result.line);

    if (result.winner === 'draw') {
      setTimeout(() => onDraw(), 600);
    } else {
      const winnerName = result.winner === 'X' ? p1Name : p2Name;
      setScores(prev => ({ ...prev, [result.winner]: prev[result.winner as 'X'|'O'] + 1 }));
      setTimeout(() => onWin(winnerName, 10), 700);
    }
  }, [ended, p1Name, p2Name, onWin, onDraw]);

  const makeMove = useCallback((idx: number, b: (string|null)[], player: 'X'|'O') => {
    const nb = [...b];
    nb[idx] = player;
    setBoard(nb);
    setPopped(idx);
    AudioManager.play('move');
    setTimeout(() => setPopped(-1), 300);

    const result = checkWinner(nb);
    if (result) {
      doEnd(result);
      return nb;
    }
    const next: 'X'|'O' = player === 'X' ? 'O' : 'X';
    setCurrent(next);

    if (vsAI && next === 'O') {
      setTimeout(() => {
        const aiIdx = getBestMove(nb);
        if (aiIdx !== -1) {
          const nb2 = [...nb];
          nb2[aiIdx] = 'O';
          setBoard(nb2);
          setPopped(aiIdx);
          AudioManager.play('move');
          setTimeout(() => setPopped(-1), 300);
          const r2 = checkWinner(nb2);
          if (r2) { doEnd(r2); return; }
          setCurrent('X');
        }
      }, 420);
    }
    return nb;
  }, [vsAI, doEnd]);

  function handleClick(i: number) {
    if (gameOver || board[i]) return;
    if (vsAI && current === 'O') return;
    makeMove(i, board, current);
  }

  const statusText = gameOver
    ? (winLine.length ? `${current === 'X' ? p2Name : p1Name} WINS!` : "DRAW!")
    : `${current === 'X' ? p1Name : p2Name}'s turn (${current})`;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Scores */}
      <div className="flex gap-8 font-pixel" style={{ fontSize: '0.6rem' }}>
        <span style={{ color: 'var(--p1)' }}>{p1Name}: {scores.X}</span>
        <span style={{ color: 'var(--p2)' }}>{p2Name}: {scores.O}</span>
      </div>

      {/* Board */}
      <div className="ttt-board">
        {board.map((cell, i) => (
          <div
            key={i}
            className={`ttt-cell${cell ? ` taken ${cell.toLowerCase()}` : ''}${winLine.includes(i) ? ' win-cell' : ''}${popped === i ? ' pop' : ''}`}
            onClick={() => handleClick(i)}
          >
            {cell || ''}
          </div>
        ))}
      </div>

      {/* Status */}
      <div
        className="ttt-status"
        style={{ color: current === 'X' ? 'var(--p1)' : 'var(--p2)' }}
      >
        {statusText}
      </div>
    </div>
  );
}

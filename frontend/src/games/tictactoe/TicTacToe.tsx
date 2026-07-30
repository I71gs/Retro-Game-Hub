import { useState, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { getBestMove } from './ai/minimax';
import { AudioManager } from '../../services/AudioManager';

type Mark = 'X' | 'O' | null;

function checkWinner(b: Mark[]): { winner: string; line: number[] } | null {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b2,c] of lines) {
    if (b[a] && b[a] === b[b2] && b[a] === b[c])
      return { winner: b[a]!, line: [a,b2,c] };
  }
  if (b.every(Boolean)) return { winner: 'draw', line: [] };
  return null;
}

export function TicTacToe({ config }: { config: GameConfig }) {
  const { p1Name, p2Name, vsAI, onWin, onDraw } = config;
  const [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [current, setCurrent] = useState<'X' | 'O'>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winLine, setWinLine] = useState<number[]>([]);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [popped, setPopped] = useState(-1);
  const ended = useRef(false);

  const doEnd = useCallback((result: { winner: string; line: number[] }) => {
    if (ended.current) return;
    ended.current = true;
    setWinner(result.winner);
    setWinLine(result.line);
    setGameOver(true);
    if (result.winner === 'draw') {
      setTimeout(() => onDraw(), 700);
    } else {
      const winnerName = result.winner === 'X' ? p1Name : p2Name;
      setScores(prev => ({ ...prev, [result.winner]: prev[result.winner as 'X'|'O'] + 1 }));
      setTimeout(() => onWin(winnerName, 10), 700);
    }
  }, [ended, p1Name, p2Name, onWin, onDraw]);

  function handleClick(i: number) {
    if (gameOver || board[i] || (vsAI && current === 'O') || ended.current) return;
    const nb = [...board];
    nb[i] = current;
    setBoard(nb);
    setPopped(i);
    AudioManager.play('move');
    setTimeout(() => setPopped(-1), 300);

    const result = checkWinner(nb);
    if (result) {
      doEnd(result);
      return;
    }
    const next: 'X' | 'O' = current === 'X' ? 'O' : 'X';
    setCurrent(next);

    if (vsAI && next === 'O') {
      setTimeout(() => {
        const move = getBestMove(nb);
        const nb2 = [...nb];
        nb2[move] = 'O';
        setBoard(nb2);
        setPopped(move);
        AudioManager.play('move');
        setTimeout(() => setPopped(-1), 300);
        const r2 = checkWinner(nb2);
        if (r2) { doEnd(r2); return; }
        setCurrent('X');
      }, 420);
    }
  }

  const symbols: Record<string, string> = { X: '✕', O: '○' };

  return (
    <div className="ttt-wrapper">
      {/* Score row */}
      <div className="game-scorebar">
        <div className="game-score-chip p1">
          {p1Name} (X) — {scores.X}
        </div>
        {!vsAI && (
          <div className="game-score-chip p2">
            {p2Name} (O) — {scores.O}
          </div>
        )}
        {vsAI && (
          <div className="game-score-chip p2">
            🤖 CPU (O) — {scores.O}
          </div>
        )}
      </div>

      {/* Turn indicator */}
      {!gameOver && (
        <div className="ttt-status">
          {current === 'X'
            ? <span style={{ color: 'var(--p1)' }}>{p1Name}'s turn (X)</span>
            : vsAI
              ? <span style={{ color: 'var(--p2)' }}>🤖 CPU thinking...</span>
              : <span style={{ color: 'var(--p2)' }}>{p2Name}'s turn (O)</span>}
        </div>
      )}

      {/* Board */}
      <div className="ttt-board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={[
              'ttt-cell',
              cell === 'X' ? 'x' : '',
              cell === 'O' ? 'o' : '',
              cell ? 'taken' : '',
              winLine.includes(i) ? 'win-cell' : '',
              popped === i ? 'pop' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleClick(i)}
          >
            {cell ? symbols[cell] : ''}
          </button>
        ))}
      </div>

      {/* Result */}
      {gameOver && (
        <div className="ttt-status" style={{ color: winner === 'draw' ? 'var(--accent3)' : 'var(--accent4)', fontSize: '0.7rem' }}>
          {winner === 'draw' ? "🤝 IT'S A DRAW!" : `🏆 ${winner === 'X' ? p1Name : (vsAI ? 'CPU' : p2Name)} WINS!`}
        </div>
      )}
    </div>
  );
}

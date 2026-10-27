import { useEffect, useState, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const SIZE = 4;

export function Game2048({ config }: { config: GameConfig }) {
  const { p1Name, onWin } = config;
  const [grid, setGrid] = useState<number[][]>(() => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('retrohub_2048_best') || '0', 10); } catch { return 0; }
  });
  const [hasWon, setHasWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });

  const spawnTile = useCallback((currentGrid: number[][]) => {
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (currentGrid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return currentGrid;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    let initial = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
    initial = spawnTile(initial);
    initial = spawnTile(initial);
    setGrid(initial);
    setScore(0);
    setHasWon(false);
    setGameOver(false);
  }, [spawnTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const canMove = useCallback((g: number[][]) => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c + 1 < SIZE && g[r][c] === g[r][c + 1]) return true;
        if (r + 1 < SIZE && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  }, []);

  const slideRow = useCallback((row: number[]) => {
    let filtered = row.filter(val => val !== 0);
    let pts = 0;
    let wonTriggered = false;
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        pts += filtered[i];
        filtered[i + 1] = 0;
        if (filtered[i] === 2048) wonTriggered = true;
      }
    }
    filtered = filtered.filter(val => val !== 0);
    while (filtered.length < SIZE) filtered.push(0);
    return { newRow: filtered, pts, wonTriggered };
  }, []);

  const handleMove = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;
    let moved = false;
    let ptsGained = 0;
    let wonNow = false;
    let nextGrid = grid.map(row => [...row]);

    if (dir === 'left') {
      for (let r = 0; r < SIZE; r++) {
        const { newRow, pts, wonTriggered } = slideRow(nextGrid[r]);
        if (newRow.some((val, i) => val !== nextGrid[r][i])) moved = true;
        nextGrid[r] = newRow;
        ptsGained += pts;
        if (wonTriggered) wonNow = true;
      }
    } else if (dir === 'right') {
      for (let r = 0; r < SIZE; r++) {
        const { newRow, pts, wonTriggered } = slideRow([...nextGrid[r]].reverse());
        newRow.reverse();
        if (newRow.some((val, i) => val !== nextGrid[r][i])) moved = true;
        nextGrid[r] = newRow;
        ptsGained += pts;
        if (wonTriggered) wonNow = true;
      }
    } else if (dir === 'up') {
      for (let c = 0; c < SIZE; c++) {
        const col = [nextGrid[0][c], nextGrid[1][c], nextGrid[2][c], nextGrid[3][c]];
        const { newRow, pts, wonTriggered } = slideRow(col);
        for (let r = 0; r < SIZE; r++) {
          if (nextGrid[r][c] !== newRow[r]) moved = true;
          nextGrid[r][c] = newRow[r];
        }
        ptsGained += pts;
        if (wonTriggered) wonNow = true;
      }
    } else if (dir === 'down') {
      for (let c = 0; c < SIZE; c++) {
        const col = [nextGrid[0][c], nextGrid[1][c], nextGrid[2][c], nextGrid[3][c]].reverse();
        const { newRow, pts, wonTriggered } = slideRow(col);
        newRow.reverse();
        for (let r = 0; r < SIZE; r++) {
          if (nextGrid[r][c] !== newRow[r]) moved = true;
          nextGrid[r][c] = newRow[r];
        }
        ptsGained += pts;
        if (wonTriggered) wonNow = true;
      }
    }

    if (moved) {
      if (ptsGained > 0) {
        AudioManager.play('capture');
        setScore(prev => {
          const updated = prev + ptsGained;
          setBestScore(b => {
            const nb = Math.max(b, updated);
            try { localStorage.setItem('retrohub_2048_best', String(nb)); } catch {}
            return nb;
          });
          return updated;
        });
      } else {
        AudioManager.play('move');
      }

      if (wonNow && !hasWon) {
        setHasWon(true);
        AudioManager.play('win');
      }

      const spawned = spawnTile(nextGrid);
      setGrid(spawned);

      if (!canMove(spawned)) {
        setGameOver(true);
        AudioManager.play('error');
        const coins = Math.min(30, Math.floor((score + ptsGained) / 80) + (hasWon || wonNow ? 15 : 2));
        setTimeout(() => {
          onWin(hasWon || wonNow ? p1Name : 'GAME OVER', coins);
        }, 500);
      }
    }
  }, [gameOver, grid, slideRow, hasWon, spawnTile, canMove, score, onWin, p1Name]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code) || ['ArrowUp', 'w', 'W'].includes(e.key)) {
        handleMove('up'); e.preventDefault();
      } else if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code) || ['ArrowDown', 's', 'S'].includes(e.key)) {
        handleMove('down'); e.preventDefault();
      } else if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
        handleMove('left'); e.preventDefault();
      } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
        handleMove('right'); e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMove]);

  function getTileClass(val: number) {
    switch (val) {
      case 2: return 'bg-[#262940] text-white';
      case 4: return 'bg-[#2b395e] text-[#00ffcc]';
      case 8: return 'bg-[#ff7700] text-white shadow-lg shadow-orange-500/30';
      case 16: return 'bg-[#ff3366] text-white shadow-lg shadow-pink-500/30';
      case 32: return 'bg-[#d62246] text-white';
      case 64: return 'bg-[#9b2226] text-white';
      case 128: return 'bg-[#7b2cbf] text-white text-xs';
      case 256: return 'bg-[#5a189a] text-yellow-300 text-xs';
      case 512: return 'bg-[#0077b6] text-white text-xs';
      case 1024: return 'bg-[#0096c7] text-white text-[10px]';
      case 2048: return 'bg-[#ffd700] text-black text-[10px] shadow-lg shadow-yellow-500/50 font-black';
      default: return 'bg-[#181826] text-transparent';
    }
  }

  return (
    <div
      className="flex flex-col items-center max-w-sm w-full mx-auto select-none"
      onTouchStart={(e) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (Math.abs(dx) > 30) handleMove(dx > 0 ? 'right' : 'left');
        } else {
          if (Math.abs(dy) > 30) handleMove(dy > 0 ? 'down' : 'up');
        }
      }}
    >
      <div className="w-full flex justify-between items-center p-3 mb-3 card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>SCORE</div>
          <div className="font-tech text-xl font-bold" style={{ color: 'var(--accent1)' }}>{score}</div>
        </div>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>TARGET</div>
          <div className="font-pixel text-xs" style={{ color: 'var(--accent3)' }}>2048</div>
        </div>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>RECORD</div>
          <div className="font-tech text-xl font-bold" style={{ color: 'var(--accent3)' }}>{bestScore}</div>
        </div>
      </div>

      <div className="p-3 rounded-xl border-2 grid grid-cols-4 gap-2 w-72 h-72 sm:w-80 sm:h-80" style={{ background: '#111122', borderColor: 'var(--border)' }}>
        {grid.flatMap((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              className={`rounded-lg flex items-center justify-center font-pixel text-sm font-bold transition-all duration-100 ${getTileClass(val)}`}
            >
              {val > 0 ? val : ''}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <button onClick={() => handleMove('up')} className="btn px-4 py-2 font-pixel text-xs">▲</button>
        <div className="flex gap-2">
          <button onClick={() => handleMove('left')} className="btn px-4 py-2 font-pixel text-xs">◀</button>
          <button onClick={initGame} className="btn px-3 py-2 font-pixel text-xs" style={{ color: 'var(--accent3)' }}>↺</button>
          <button onClick={() => handleMove('right')} className="btn px-4 py-2 font-pixel text-xs">▶</button>
        </div>
        <button onClick={() => handleMove('down')} className="btn px-4 py-2 font-pixel text-xs">▼</button>
      </div>
      <div className="mt-2 font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>
        SWIPE OR USE ARROW KEYS / WASD
      </div>
    </div>
  );
}

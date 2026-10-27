import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const GRID_SIZE = 20;
const CELL_COUNT = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_COUNT;

export function Snake({ config }: { config: GameConfig }) {
  const { p1Name, onWin } = config;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('retrohub_snake_hs') || '0', 10); } catch { return 0; }
  });
  const [paused, setPaused] = useState(false);

  const gameState = useRef({
    snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 15, y: 10 },
    goldenFruit: null as { x: number; y: number } | null,
    goldenTimer: 0,
    score: 0,
    speed: 110,
    gameOver: false,
    paused: false,
  });

  const triggerEnd = useCallback((finalScore: number, won: boolean, _reason: string) => {
    gameState.current.gameOver = true;
    AudioManager.play('error');
    const coins = Math.min(30, Math.floor(finalScore / 5) + (won ? 10 : 2));
    setTimeout(() => {
      onWin(won ? p1Name : 'GAME OVER', coins);
    }, 400);
  }, [p1Name, onWin]);

  const setDirection = useCallback((x: number, y: number) => {
    const s = gameState.current;
    if (x !== 0 && s.dir.x === -x) return;
    if (y !== 0 && s.dir.y === -y) return;
    s.nextDir = { x, y };
  }, []);

  const togglePause = useCallback(() => {
    gameState.current.paused = !gameState.current.paused;
    setPaused(gameState.current.paused);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = gameState.current;

    function spawnFood() {
      let valid = false;
      while (!valid) {
        s.food = {
          x: Math.floor(Math.random() * CELL_COUNT),
          y: Math.floor(Math.random() * CELL_COUNT),
        };
        valid = !s.snake.some(seg => seg.x === s.food.x && seg.y === s.food.y);
      }
      if (!s.goldenFruit && Math.random() < 0.25 && s.score >= 30) {
        s.goldenFruit = {
          x: Math.floor(Math.random() * CELL_COUNT),
          y: Math.floor(Math.random() * CELL_COUNT),
        };
        s.goldenTimer = 35;
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code) || ['ArrowUp', 'w', 'W'].includes(e.key)) {
        setDirection(0, -1);
        e.preventDefault();
      } else if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code) || ['ArrowDown', 's', 'S'].includes(e.key)) {
        setDirection(0, 1);
        e.preventDefault();
      } else if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
        setDirection(-1, 0);
        e.preventDefault();
      } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
        setDirection(1, 0);
        e.preventDefault();
      } else if (e.code === 'Space') {
        togglePause();
        e.preventDefault();
      }
    }

    window.addEventListener('keydown', handleKey);

    let timerId: any = null;

    function step() {
      if (s.gameOver || s.paused) return;

      s.dir = { ...s.nextDir };
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

      // Perimeter crash
      if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
        triggerEnd(s.score, s.score >= 50, 'Wall hit');
        return;
      }
      // Tail collision
      if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        triggerEnd(s.score, s.score >= 50, 'Tail bite');
        return;
      }

      s.snake.unshift(head);

      if (head.x === s.food.x && head.y === s.food.y) {
        s.score += 10;
        setScore(s.score);
        setHighScore(prev => {
          const next = Math.max(prev, s.score);
          try { localStorage.setItem('retrohub_snake_hs', String(next)); } catch {}
          return next;
        });
        AudioManager.play('capture');
        spawnFood();
        if (s.speed > 55 && s.score % 40 === 0) {
          s.speed = Math.max(50, s.speed - 6);
          clearInterval(timerId);
          timerId = setInterval(step, s.speed);
        }
      } else if (s.goldenFruit && head.x === s.goldenFruit.x && head.y === s.goldenFruit.y) {
        s.score += 35;
        s.goldenFruit = null;
        setScore(s.score);
        AudioManager.play('coin');
      } else {
        s.snake.pop();
      }

      if (s.goldenFruit) {
        s.goldenTimer--;
        if (s.goldenTimer <= 0) s.goldenFruit = null;
      }

      draw();
    }

    function draw() {
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Subtle grid
      ctx.strokeStyle = '#151525';
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE);
        ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
      }

      // Food
      ctx.fillStyle = '#ff2255';
      ctx.shadowColor = '#ff2255';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.food.x * GRID_SIZE + GRID_SIZE / 2, s.food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Golden fruit
      if (s.goldenFruit) {
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(s.goldenFruit.x * GRID_SIZE + GRID_SIZE / 2, s.goldenFruit.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Snake
      s.snake.forEach((seg, i) => {
        const isHead = i === 0;
        ctx.fillStyle = isHead ? '#00ffaa' : '#00bb77';
        if (isHead) {
          ctx.shadowColor = '#00ffaa';
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      });
      ctx.shadowBlur = 0;
    }

    spawnFood();
    draw();
    timerId = setInterval(step, s.speed);

    return () => {
      clearInterval(timerId);
      window.removeEventListener('keydown', handleKey);
    };
  }, [setDirection, togglePause, triggerEnd]);

  return (
    <div className="flex flex-col items-center max-w-md w-full mx-auto select-none">
      <div className="w-full flex justify-between items-center p-3 mb-3 card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>SCORE</div>
          <div className="font-tech text-xl font-bold" style={{ color: 'var(--accent1)' }}>{score}</div>
        </div>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>STATUS</div>
          <div className="font-pixel text-xs" style={{ color: paused ? 'var(--accent2)' : 'var(--accent3)' }}>{paused ? 'PAUSED' : 'ACTIVE'}</div>
        </div>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>RECORD</div>
          <div className="font-tech text-xl font-bold" style={{ color: 'var(--accent3)' }}>{highScore}</div>
        </div>
      </div>

      <div className="relative border-2 rounded-lg overflow-hidden shadow-2xl" style={{ borderColor: 'var(--border)', background: '#0a0a14' }}>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block max-w-full h-auto" />
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <button onClick={() => setDirection(0, -1)} className="btn px-4 py-2 font-pixel text-xs">▲</button>
        <div className="flex gap-2">
          <button onClick={() => setDirection(-1, 0)} className="btn px-4 py-2 font-pixel text-xs">◀</button>
          <button onClick={togglePause} className="btn px-3 py-2 font-pixel text-xs" style={{ color: 'var(--accent3)' }}>{paused ? '▶' : '⏸'}</button>
          <button onClick={() => setDirection(1, 0)} className="btn px-4 py-2 font-pixel text-xs">▶</button>
        </div>
        <button onClick={() => setDirection(0, 1)} className="btn px-4 py-2 font-pixel text-xs">▼</button>
      </div>
      <div className="mt-2 font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>
        ARROW KEYS / WASD / D-PAD
      </div>
    </div>
  );
}

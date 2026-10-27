import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const WIDTH = 480;
const HEIGHT = 420;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_HEIGHT = 16;
const BRICK_GAP = 5;
const BRICK_TOP_OFFSET = 45;

const ROW_COLORS = ['#ff2255', '#ff7700', '#ffd700', '#00ffaa', '#00e5ff'];
const ROW_POINTS = [50, 40, 30, 20, 10];

export function Breakout({ config }: { config: GameConfig }) {
  const { p1Name, onWin } = config;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isServing, setIsServing] = useState(true);

  const state = useRef({
    paddleX: (WIDTH - PADDLE_WIDTH) / 2,
    ballX: WIDTH / 2,
    ballY: HEIGHT - 35,
    ballSpeed: 4.5,
    ballVx: 3,
    ballVy: -3.5,
    bricks: [] as { x: number; y: number; width: number; height: number; alive: boolean; color: string; points: number }[][],
    score: 0,
    lives: 3,
    gameOver: false,
    isServing: true,
    keys: { left: false, right: false },
  });

  const launch = useCallback(() => {
    const s = state.current;
    if (s.isServing && !s.gameOver) {
      s.isServing = false;
      setIsServing(false);
      s.ballVx = (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 1.5);
      s.ballVy = -s.ballSpeed;
      AudioManager.play('place');
    }
  }, []);

  const movePaddle = useCallback((dir: 'left' | 'right') => {
    const s = state.current;
    const speed = 25;
    if (dir === 'left') {
      s.paddleX = Math.max(0, s.paddleX - speed);
    } else {
      s.paddleX = Math.min(WIDTH - PADDLE_WIDTH, s.paddleX + speed);
    }
    if (s.isServing) s.ballX = s.paddleX + PADDLE_WIDTH / 2;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = state.current;

    // Build bricks
    const brickWidth = (WIDTH - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;
    s.bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      s.bricks[r] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        s.bricks[r][c] = {
          x: BRICK_GAP + c * (brickWidth + BRICK_GAP),
          y: BRICK_TOP_OFFSET + r * (BRICK_HEIGHT + BRICK_GAP),
          width: brickWidth,
          height: BRICK_HEIGHT,
          alive: true,
          color: ROW_COLORS[r],
          points: ROW_POINTS[r],
        };
      }
    }

    function resetBall() {
      s.paddleX = (WIDTH - PADDLE_WIDTH) / 2;
      s.ballX = s.paddleX + PADDLE_WIDTH / 2;
      s.ballY = HEIGHT - 35;
      s.ballSpeed = 4.5;
      s.isServing = true;
      setIsServing(true);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      s.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2));
      if (s.isServing) s.ballX = s.paddleX + PADDLE_WIDTH / 2;
    }

    function handleTouchMove(e: TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      s.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2));
      if (s.isServing) s.ballX = s.paddleX + PADDLE_WIDTH / 2;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
        s.keys.left = true; e.preventDefault();
      } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
        s.keys.right = true; e.preventDefault();
      } else if (e.code === 'Space') {
        launch(); e.preventDefault();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
        s.keys.left = false;
      } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
        s.keys.right = false;
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('click', launch);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId = 0;

    function loop() {
      if (!s.gameOver) {
        if (s.keys.left) {
          s.paddleX = Math.max(0, s.paddleX - 7);
          if (s.isServing) s.ballX = s.paddleX + PADDLE_WIDTH / 2;
        }
        if (s.keys.right) {
          s.paddleX = Math.min(WIDTH - PADDLE_WIDTH, s.paddleX + 7);
          if (s.isServing) s.ballX = s.paddleX + PADDLE_WIDTH / 2;
        }

        if (!s.isServing) {
          s.ballX += s.ballVx;
          s.ballY += s.ballVy;

          // Wall bounce
          if (s.ballX - BALL_RADIUS <= 0) {
            s.ballX = BALL_RADIUS; s.ballVx = -s.ballVx; AudioManager.play('move');
          } else if (s.ballX + BALL_RADIUS >= WIDTH) {
            s.ballX = WIDTH - BALL_RADIUS; s.ballVx = -s.ballVx; AudioManager.play('move');
          }
          if (s.ballY - BALL_RADIUS <= 0) {
            s.ballY = BALL_RADIUS; s.ballVy = -s.ballVy; AudioManager.play('move');
          }

          // Paddle bounce
          const paddleY = HEIGHT - 22;
          if (
            s.ballY + BALL_RADIUS >= paddleY &&
            s.ballY - BALL_RADIUS <= paddleY + PADDLE_HEIGHT &&
            s.ballX >= s.paddleX &&
            s.ballX <= s.paddleX + PADDLE_WIDTH &&
            s.ballVy > 0
          ) {
            const hitPoint = (s.ballX - (s.paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
            const bounceAngle = hitPoint * ((5 * Math.PI) / 12);
            s.ballSpeed = Math.min(8, s.ballSpeed + 0.15);
            s.ballVx = s.ballSpeed * Math.sin(bounceAngle);
            s.ballVy = -s.ballSpeed * Math.cos(bounceAngle);
            AudioManager.play('move');
          }

          // Brick collision
          let remaining = 0;
          for (let r = 0; r < BRICK_ROWS; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
              const b = s.bricks[r][c];
              if (b.alive) {
                remaining++;
                if (
                  s.ballX + BALL_RADIUS > b.x &&
                  s.ballX - BALL_RADIUS < b.x + b.width &&
                  s.ballY + BALL_RADIUS > b.y &&
                  s.ballY - BALL_RADIUS < b.y + b.height
                ) {
                  b.alive = false;
                  remaining--;
                  s.score += b.points;
                  s.ballVy = -s.ballVy;
                  setScore(s.score);
                  AudioManager.play('capture');

                  if (remaining === 0) {
                    s.gameOver = true;
                    AudioManager.play('win');
                    setTimeout(() => onWin(p1Name, 25), 400);
                    return;
                  }
                }
              }
            }
          }

          // Out of bounds
          if (s.ballY - BALL_RADIUS > HEIGHT) {
            s.lives--;
            setLives(s.lives);
            AudioManager.play('error');
            if (s.lives <= 0) {
              s.gameOver = true;
              setTimeout(() => onWin('GAME OVER', 2), 400);
            } else {
              resetBall();
            }
          }
        }
      }

      // Draw
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Bricks
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          const b = s.bricks[r][c];
          if (b && b.alive) {
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(b.x, b.y, b.width, b.height);
          }
        }
      }
      ctx.shadowBlur = 0;

      // Paddle
      const paddleY = HEIGHT - 22;
      ctx.fillStyle = '#00ffaa';
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 8;
      ctx.fillRect(s.paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = '#ff0066';
      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('click', launch);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [launch, onWin, p1Name]);

  return (
    <div className="flex flex-col items-center max-w-lg w-full mx-auto select-none">
      <div className="w-full flex justify-between items-center p-3 mb-3 card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>SCORE</div>
          <div className="font-tech text-xl font-bold" style={{ color: 'var(--accent1)' }}>{score}</div>
        </div>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>LIVES</div>
          <div className="font-tech text-xl font-bold" style={{ color: 'var(--accent2)' }}>{'♥'.repeat(Math.max(0, lives))}</div>
        </div>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>LAUNCH</div>
          <button onClick={launch} className="btn px-2 py-1 font-pixel text-[9px]" style={{ color: 'var(--accent3)' }}>
            {isServing ? '🚀 LAUNCH' : 'IN PLAY'}
          </button>
        </div>
      </div>

      <div className="relative border-2 rounded-lg overflow-hidden shadow-2xl cursor-crosshair" style={{ borderColor: 'var(--border)', background: '#0a0a14' }}>
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block max-w-full h-auto" />
      </div>

      <div className="mt-3 flex gap-2 w-full max-w-md">
        <button onClick={() => movePaddle('left')} className="btn flex-1 py-3 font-pixel text-[10px]">◀ MOVE LEFT</button>
        <button onClick={launch} className="btn px-4 py-3 font-pixel text-[10px]" style={{ color: 'var(--accent3)' }}>🚀 LAUNCH</button>
        <button onClick={() => movePaddle('right')} className="btn flex-1 py-3 font-pixel text-[10px]">MOVE RIGHT ▶</button>
      </div>
      <div className="mt-2 font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>
        MOUSE / TOUCH DRAG / ARROWS / A & D
      </div>
    </div>
  );
}

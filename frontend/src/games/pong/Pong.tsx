import { useEffect, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const W = 640, H = 400;
const PADDLE_W = 12, PADDLE_H = 70;
const BALL_R = 8;
const PADDLE_SPEED = 5;
const WIN_SCORE = 5;

export function Pong({ config }: { config: GameConfig }) {
  const { p1Name, onWin } = config;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef({
    p1y: H/2 - PADDLE_H/2,
    p2y: H/2 - PADDLE_H/2,
    bx: W/2, by: H/2,
    vx: 4 * (Math.random() > 0.5 ? 1 : -1),
    vy: 3 * (Math.random() > 0.5 ? 1 : -1),
    score1: 0, score2: 0,
    keys: {} as Record<string, boolean>,
    gameOver: false,
    aiTarget: H/2,
  });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const g = gameRef.current;

    function handleKey(e: KeyboardEvent) {
      g.keys[e.key] = e.type === 'keydown';
    }
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);

    function getAccentColor(varName: string): string {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#fff';
    }

    function resetBall(dir: 1|-1) {
      g.bx = W/2; g.by = H/2;
      g.vx = (4 + Math.random()) * dir;
      g.vy = (3 + Math.random() * 2) * (Math.random() > 0.5 ? 1 : -1);
    }

    function update() {
      if (g.gameOver) return;

      // Player paddle (W A S D or arrow keys)
      if (g.keys['ArrowUp'] || g.keys['w'] || g.keys['W'])
        g.p1y = Math.max(0, g.p1y - PADDLE_SPEED);
      if (g.keys['ArrowDown'] || g.keys['s'] || g.keys['S'])
        g.p1y = Math.min(H - PADDLE_H, g.p1y + PADDLE_SPEED);

      // AI paddle — predict ball
      if (g.vx > 0) { // ball moving toward AI
        const timeToReach = (W - BALL_R - 20 - g.bx) / g.vx;
        g.aiTarget = g.by + g.vy * timeToReach;
        // Clamp prediction
        while (g.aiTarget < 0 || g.aiTarget > H) {
          if (g.aiTarget < 0) g.aiTarget = -g.aiTarget;
          if (g.aiTarget > H) g.aiTarget = 2*H - g.aiTarget;
        }
      }
      const aiCenter = g.p2y + PADDLE_H/2;
      const aiErr = (Math.random() - 0.5) * 20; // add error
      const diff = g.aiTarget + aiErr - aiCenter;
      const aiSpeed = Math.min(Math.abs(diff), PADDLE_SPEED - 0.5);
      g.p2y += Math.sign(diff) * aiSpeed;
      g.p2y = Math.max(0, Math.min(H - PADDLE_H, g.p2y));

      // Ball movement
      g.bx += g.vx;
      g.by += g.vy;

      // Top/bottom bounce
      if (g.by - BALL_R < 0) { g.by = BALL_R; g.vy = Math.abs(g.vy); }
      if (g.by + BALL_R > H) { g.by = H - BALL_R; g.vy = -Math.abs(g.vy); }

      // Paddle collision - left
      if (g.bx - BALL_R < 20 + PADDLE_W && g.by > g.p1y && g.by < g.p1y + PADDLE_H && g.vx < 0) {
        g.vx = Math.abs(g.vx) * 1.05;
        const hitRel = (g.by - g.p1y) / PADDLE_H - 0.5;
        g.vy = hitRel * 8;
        AudioManager.play('hit');
      }

      // Paddle collision - right
      if (g.bx + BALL_R > W - 20 - PADDLE_W && g.by > g.p2y && g.by < g.p2y + PADDLE_H && g.vx > 0) {
        g.vx = -Math.abs(g.vx) * 1.05;
        const hitRel = (g.by - g.p2y) / PADDLE_H - 0.5;
        g.vy = hitRel * 8;
        AudioManager.play('hit');
      }

      // Speed cap
      const speed = Math.sqrt(g.vx*g.vx + g.vy*g.vy);
      if (speed > 14) { g.vx = g.vx/speed*14; g.vy = g.vy/speed*14; }

      // Score
      if (g.bx < 0) {
        g.score2++;
        AudioManager.play('miss');
        if (g.score2 >= WIN_SCORE) {
          g.gameOver = true;
          setTimeout(() => onWin('COMPUTER', null), 300);
        } else resetBall(1);
      }
      if (g.bx > W) {
        g.score1++;
        AudioManager.play('coin');
        if (g.score1 >= WIN_SCORE) {
          g.gameOver = true;
          setTimeout(() => onWin(p1Name, 12), 300);
        } else resetBall(-1);
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Center line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
      ctx.setLineDash([]);

      // Scores
      ctx.font = 'bold 3rem "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = getAccentColor('--accent1');
      ctx.fillText(`${g.score1}`, W/4, 60);
      ctx.fillStyle = getAccentColor('--accent2');
      ctx.fillText(`${g.score2}`, 3*W/4, 60);

      // Player names
      ctx.font = '0.6rem "Press Start 2P", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(p1Name, W/4, 80);
      ctx.fillText('CPU', 3*W/4, 80);

      // Paddles
      ctx.fillStyle = getAccentColor('--p1');
      ctx.shadowColor = getAccentColor('--p1');
      ctx.shadowBlur = 10;
      ctx.fillRect(20, g.p1y, PADDLE_W, PADDLE_H);
      ctx.fill();

      ctx.fillStyle = getAccentColor('--p2');
      ctx.shadowColor = getAccentColor('--p2');
      ctx.fillRect(W - 20 - PADDLE_W, g.p2y, PADDLE_W, PADDLE_H);
      ctx.fill();

      // Ball
      ctx.fillStyle = getAccentColor('--accent3');
      ctx.shadowColor = getAccentColor('--accent3');
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(g.bx, g.by, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Win screen
      if (g.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = 'bold 2rem "Press Start 2P", monospace';
        ctx.fillStyle = getAccentColor('--accent3');
        ctx.textAlign = 'center';
        ctx.fillText(g.score1 >= WIN_SCORE ? `${p1Name} WINS!` : 'CPU WINS!', W/2, H/2);
      }
    }

    function loop() {
      update();
      draw();
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [p1Name, onWin]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="pong-canvas"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <p className="font-pixel" style={{ color: 'var(--text-muted)', fontSize: '0.45rem' }}>
        ↑↓ or W/S to move · First to {WIN_SCORE} wins
      </p>
    </div>
  );
}

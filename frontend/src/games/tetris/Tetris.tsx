import { useEffect, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

// Tetris constants
const COLS = 10;
const ROWS = 20;
const BLOCK = 28;
const NEXT_BLOCK = 24;

const TETROMINOS: Record<string, { shape: number[][]; color: string }> = {
  I: { shape: [[1,1,1,1]], color: 'var(--accent5)' },
  O: { shape: [[1,1],[1,1]], color: 'var(--accent3)' },
  T: { shape: [[0,1,0],[1,1,1]], color: 'var(--accent1)' },
  S: { shape: [[0,1,1],[1,1,0]], color: 'var(--accent4)' },
  Z: { shape: [[1,1,0],[0,1,1]], color: 'var(--accent2)' },
  J: { shape: [[1,0,0],[1,1,1]], color: 'var(--accent5)' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#ff9f43' },
};

const PIECES = Object.keys(TETROMINOS);

function randomPiece() {
  const key = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { key, ...TETROMINOS[key] };
}

function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function emptyBoard(): (string|null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function Tetris({ config }: { config: GameConfig }) {
  // Tetris is a solo game; uses config.onDraw for game-over notification

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    board: emptyBoard(),
    piece: randomPiece(),
    nextPiece: randomPiece(),
    x: 3, y: 0,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    paused: false,
  });
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const dropCounterRef = useRef(0);

  function getDropInterval(level: number) { return Math.max(100, 800 - (level - 1) * 70); }

  function isValid(shape: number[][], bx: number, by: number, board: (string|null)[][]) {
    return shape.every((row, r) =>
      row.every((cell, c) => {
        if (!cell) return true;
        const nx = bx + c, ny = by + r;
        return nx >= 0 && nx < COLS && ny < ROWS && (ny < 0 || !board[ny][nx]);
      })
    );
  }

  function lockPiece() {
    const s = stateRef.current;
    s.piece.shape.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell && s.y + r >= 0) s.board[s.y + r][s.x + c] = s.piece.color;
      })
    );

    // Clear lines
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (s.board[r].every(cell => cell !== null)) {
        s.board.splice(r, 1);
        s.board.unshift(Array(COLS).fill(null));
        r++;
        cleared++;
      }
    }

    const linePoints = [0, 100, 300, 500, 800];
    s.score += (linePoints[cleared] || 0) * s.level;
    s.lines += cleared;
    s.level = Math.floor(s.lines / 10) + 1;
    if (cleared > 0) AudioManager.play('lineclr');

    s.piece = s.nextPiece;
    s.nextPiece = randomPiece();
    s.x = 3;
    s.y = 0;

    if (!isValid(s.piece.shape, s.x, s.y, s.board)) {
      s.gameOver = true;
      setTimeout(() => config.onDraw(), 300); // game over = draw (no opponent)
    }
  }

  function drawBoard(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0a0a0f';
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i*BLOCK,0); ctx.lineTo(i*BLOCK,ROWS*BLOCK); ctx.stroke(); }
    for (let i = 0; i < ROWS; i++) { ctx.beginPath(); ctx.moveTo(0,i*BLOCK); ctx.lineTo(COLS*BLOCK,i*BLOCK); ctx.stroke(); }

    // Board
    s.board.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) {
          ctx.fillStyle = cell;
          ctx.fillRect(c*BLOCK+1, r*BLOCK+1, BLOCK-2, BLOCK-2);
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(c*BLOCK+1, r*BLOCK+1, BLOCK-2, 4);
        }
      })
    );

    // Ghost piece
    let ghostY = s.y;
    while (isValid(s.piece.shape, s.x, ghostY + 1, s.board)) ghostY++;
    if (ghostY !== s.y) {
      ctx.globalAlpha = 0.2;
      s.piece.shape.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell) {
            ctx.fillStyle = s.piece.color;
            ctx.fillRect((s.x+c)*BLOCK+1, (ghostY+r)*BLOCK+1, BLOCK-2, BLOCK-2);
          }
        })
      );
      ctx.globalAlpha = 1;
    }

    // Active piece
    s.piece.shape.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) {
          ctx.fillStyle = s.piece.color;
          ctx.fillRect((s.x+c)*BLOCK+1, (s.y+r)*BLOCK+1, BLOCK-2, BLOCK-2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect((s.x+c)*BLOCK+1, (s.y+r)*BLOCK+1, BLOCK-2, 4);
        }
      })
    );
  }

  function drawNext(ctx: CanvasRenderingContext2D) {
    const s = stateRef.current;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#12121a';
    ctx.fillRect(0, 0, 4*NEXT_BLOCK, 4*NEXT_BLOCK);
    const shape = s.nextPiece.shape;
    const offsetX = Math.floor((4 - shape[0].length) / 2);
    const offsetY = Math.floor((4 - shape.length) / 2);
    shape.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) {
          ctx.fillStyle = s.nextPiece.color;
          ctx.fillRect((offsetX+c)*NEXT_BLOCK+1, (offsetY+r)*NEXT_BLOCK+1, NEXT_BLOCK-2, NEXT_BLOCK-2);
        }
      })
    );
  }

  function gameLoop(time: number) {
    const s = stateRef.current;
    if (s.gameOver || s.paused) return;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    dropCounterRef.current += delta;

    if (dropCounterRef.current > getDropInterval(s.level)) {
      dropCounterRef.current = 0;
      if (isValid(s.piece.shape, s.x, s.y + 1, s.board)) {
        s.y++;
      } else {
        lockPiece();
        AudioManager.play('drop');
      }
    }

    const canvas = canvasRef.current;
    const nextCanvas = nextRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawBoard(ctx);
    }
    if (nextCanvas) {
      const ctx = nextCanvas.getContext('2d');
      if (ctx) drawNext(ctx);
    }

    animRef.current = requestAnimationFrame(gameLoop);
  }

  useEffect(() => {
    animRef.current = requestAnimationFrame(gameLoop);

    function handleKey(e: KeyboardEvent) {
      const s = stateRef.current;
      if (s.gameOver || s.paused) return;
      switch (e.key) {
        case 'ArrowLeft':
          if (isValid(s.piece.shape, s.x - 1, s.y, s.board)) { s.x--; AudioManager.play('move'); }
          break;
        case 'ArrowRight':
          if (isValid(s.piece.shape, s.x + 1, s.y, s.board)) { s.x++; AudioManager.play('move'); }
          break;
        case 'ArrowDown':
          if (isValid(s.piece.shape, s.x, s.y + 1, s.board)) { s.y++; dropCounterRef.current = 0; }
          break;
        case 'ArrowUp':
        case 'z':
        case 'Z': {
          const rotated = rotate(s.piece.shape);
          if (isValid(rotated, s.x, s.y, s.board)) { s.piece.shape = rotated; AudioManager.play('move'); }
          break;
        }
        case ' ':
          e.preventDefault();
          while (isValid(s.piece.shape, s.x, s.y + 1, s.board)) s.y++;
          lockPiece();
          AudioManager.play('drop');
          break;
        case 'p':
        case 'P':
          s.paused = !s.paused;
          if (!s.paused) animRef.current = requestAnimationFrame(gameLoop);
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const s = stateRef.current;

  return (
    <div className="tetris-wrapper">
      <canvas
        ref={canvasRef}
        width={COLS * BLOCK}
        height={ROWS * BLOCK}
        className="tetris-canvas"
      />
      <div className="tetris-sidebar">
        <div className="tetris-info-box">
          SCORE<div className="value">{s.score}</div>
        </div>
        <div className="tetris-info-box">
          LINES<div className="value">{s.lines}</div>
        </div>
        <div className="tetris-info-box">
          LEVEL<div className="value">{s.level}</div>
        </div>
        <div className="tetris-info-box">
          NEXT
          <canvas
            ref={nextRef}
            width={4 * NEXT_BLOCK}
            height={4 * NEXT_BLOCK}
            className="tetris-next-canvas mt-2"
          />
        </div>
        <div className="tetris-info-box" style={{ fontSize: '0.4rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          ← → MOVE<br/>
          ↑ / Z ROTATE<br/>
          ↓ SOFT DROP<br/>
          SPACE HARD DROP<br/>
          P PAUSE
        </div>
      </div>
    </div>
  );
}

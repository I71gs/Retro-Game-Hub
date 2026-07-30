import { useState, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const GRID = 4; // 4x4 dots → 3x3 boxes

function emptyLines() {
  return {
    h: Array.from({ length: GRID }, () => Array(GRID - 1).fill(false)),
    v: Array.from({ length: GRID - 1 }, () => Array(GRID).fill(false)),
  };
}

function getAIMove(lines: ReturnType<typeof emptyLines>) {
  const moves: [string,number,number][] = [];
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID - 1; c++)
      if (!lines.h[r][c]) moves.push(['h',r,c]);
  for (let r = 0; r < GRID - 1; r++)
    for (let c = 0; c < GRID; c++)
      if (!lines.v[r][c]) moves.push(['v',r,c]);

  // Try to complete a box
  for (const [type, r, c] of moves) {
    const test = { h: lines.h.map(row=>[...row]), v: lines.v.map(row=>[...row]) };
    if (type === 'h') test.h[r][c] = true; else test.v[r][c] = true;
    const before = countFilledBoxes(lines);
    const after = countFilledBoxes(test);
    if (after > before) return [type, r, c] as [string,number,number];
  }
  return moves[Math.floor(Math.random() * moves.length)];
}

function countFilledBoxes(lines: ReturnType<typeof emptyLines>) {
  let count = 0;
  for (let r = 0; r < GRID - 1; r++)
    for (let c = 0; c < GRID - 1; c++)
      if (lines.h[r][c] && lines.h[r+1][c] && lines.v[r][c] && lines.v[r][c+1]) count++;
  return count;
}

export function DotsGame({ config }: { config: GameConfig }) {
  const { p1Name, p2Name, vsAI, onWin, onDraw } = config;
  const [lines, setLines] = useState(emptyLines);
  const [boxOwner, setBoxOwner] = useState<(number|null)[][]>(
    Array.from({ length: GRID - 1 }, () => Array(GRID - 1).fill(null))
  );
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [current, setCurrent] = useState<1|2>(1);
  const [gameOver, setGameOver] = useState(false);
  const ended = useRef(false);

  const DOT_SIZE = 12;
  const LINE_LEN = 52;
  const TOTAL = DOT_SIZE + LINE_LEN;

  const applyMove = useCallback((type: string, r: number, c: number, lns: ReturnType<typeof emptyLines>, player: 1|2) => {
    const nl = { h: lns.h.map(row => [...row]), v: lns.v.map(row => [...row]) };
    if (type === 'h') nl.h[r][c] = true; else nl.v[r][c] = true;

    const nb = boxOwner.map(row => [...row]);
    let scored = 0;
    for (let br = 0; br < GRID - 1; br++) {
      for (let bc = 0; bc < GRID - 1; bc++) {
        if (nb[br][bc] === null && nl.h[br][bc] && nl.h[br+1][bc] && nl.v[br][bc] && nl.v[br][bc+1]) {
          nb[br][bc] = player;
          scored++;
        }
      }
    }

    setLines(nl);
    setBoxOwner(nb);
    AudioManager.play('click');

    const p1Boxes = nb.flat().filter(x => x === 1).length;
    const p2Boxes = nb.flat().filter(x => x === 2).length;
    const newScores = { 1: p1Boxes, 2: p2Boxes };
    setScores(newScores);

    const totalBoxes = (GRID - 1) * (GRID - 1);
    const filled = p1Boxes + p2Boxes;

    if (filled === totalBoxes && !ended.current) {
      ended.current = true;
      setGameOver(true);
      setTimeout(() => {
        if (p1Boxes > p2Boxes) onWin(p1Name, 15);
        else if (p2Boxes > p1Boxes) onWin(p2Name, null);
        else onDraw();
      }, 500);
      return nl;
    }

    const next: 1|2 = scored > 0 ? player : (player === 1 ? 2 : 1);
    setCurrent(next);

    if (vsAI && next === 2 && !ended.current) {
      setTimeout(() => {
        const [at, ar, ac] = getAIMove(nl);
        applyMove(at, ar as number, ac as number, nl, 2);
      }, 400);
    }
    return nl;
  }, [boxOwner, p1Name, p2Name, onWin, onDraw, vsAI]);

  function handleLine(type: string, r: number, c: number) {
    if (gameOver) return;
    if (vsAI && current === 2) return;
    const lns = type === 'h' ? (lines.h[r][c] ? null : lines) : (lines.v[r][c] ? null : lines);
    if (!lns) return;
    applyMove(type, r, c, lines, current);
  }

  const W = TOTAL * GRID - LINE_LEN;
  const H = TOTAL * GRID - LINE_LEN;

  return (
    <div className="dots-wrapper">
      {/* Scores */}
      <div className="dots-score">
        <span className="dots-score-p1">{p1Name}: {scores[1]}</span>
        <span className="dots-score-p2">{p2Name}: {scores[2]}</span>
      </div>

      {/* Turn indicator */}
      <div className="font-pixel text-center" style={{ fontSize: '0.55rem', color: current === 1 ? 'var(--p1)' : 'var(--p2)' }}>
        {gameOver ? 'GAME OVER' : `${current === 1 ? p1Name : p2Name}'S TURN`}
      </div>

      {/* SVG board */}
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        {/* Boxes */}
        {boxOwner.map((row, r) =>
          row.map((owner, c) => owner !== null && (
            <rect
              key={`box-${r}-${c}`}
              x={c * TOTAL + DOT_SIZE / 2}
              y={r * TOTAL + DOT_SIZE / 2}
              width={LINE_LEN}
              height={LINE_LEN}
              fill={owner === 1 ? 'rgba(108,99,255,0.35)' : 'rgba(255,107,107,0.35)'}
              rx={3}
            />
          ))
        )}

        {/* Horizontal lines */}
        {lines.h.map((row, r) =>
          row.map((drawn, c) => (
            <line
              key={`h-${r}-${c}`}
              x1={c * TOTAL + DOT_SIZE}
              y1={r * TOTAL + DOT_SIZE / 2}
              x2={c * TOTAL + DOT_SIZE + LINE_LEN}
              y2={r * TOTAL + DOT_SIZE / 2}
              stroke={drawn ? (current === 1 ? 'var(--p2)' : 'var(--p1)') : 'var(--border)'}
              strokeWidth={drawn ? 4 : 3}
              strokeLinecap="round"
              style={{ cursor: drawn || gameOver ? 'default' : 'pointer', transition: 'stroke 0.15s' }}
              onClick={() => !drawn && handleLine('h', r, c)}
              onMouseEnter={e => { if (!drawn && !gameOver) (e.target as SVGLineElement).setAttribute('stroke', current === 1 ? 'var(--p1)' : 'var(--p2)'); }}
              onMouseLeave={e => { if (!drawn) (e.target as SVGLineElement).setAttribute('stroke', 'var(--border)'); }}
            />
          ))
        )}

        {/* Vertical lines */}
        {lines.v.map((row, r) =>
          row.map((drawn, c) => (
            <line
              key={`v-${r}-${c}`}
              x1={c * TOTAL + DOT_SIZE / 2}
              y1={r * TOTAL + DOT_SIZE}
              x2={c * TOTAL + DOT_SIZE / 2}
              y2={r * TOTAL + DOT_SIZE + LINE_LEN}
              stroke={drawn ? (current === 1 ? 'var(--p2)' : 'var(--p1)') : 'var(--border)'}
              strokeWidth={drawn ? 4 : 3}
              strokeLinecap="round"
              style={{ cursor: drawn || gameOver ? 'default' : 'pointer', transition: 'stroke 0.15s' }}
              onClick={() => !drawn && handleLine('v', r, c)}
              onMouseEnter={e => { if (!drawn && !gameOver) (e.target as SVGLineElement).setAttribute('stroke', current === 1 ? 'var(--p1)' : 'var(--p2)'); }}
              onMouseLeave={e => { if (!drawn) (e.target as SVGLineElement).setAttribute('stroke', 'var(--border)'); }}
            />
          ))
        )}

        {/* Dots */}
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => (
            <circle
              key={`dot-${r}-${c}`}
              cx={c * TOTAL + DOT_SIZE / 2}
              cy={r * TOTAL + DOT_SIZE / 2}
              r={DOT_SIZE / 2}
              fill="var(--accent1)"
            />
          ))
        )}
      </svg>
    </div>
  );
}

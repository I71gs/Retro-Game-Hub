import React, { useState, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

// Board: 100 cells (1-100). Snakes and ladders positions
const SNAKES: Record<number,number> = { 99:14, 89:68, 76:37, 54:33, 43:17, 40:29, 27:1 };
const LADDERS: Record<number,number> = { 4:56, 13:76, 33:49, 42:63, 50:69, 62:81, 74:92 };
const TOTAL = 100;

function rollDice(): number { return Math.floor(Math.random() * 6) + 1; }

const DICE_FACE: Record<number,string> = { 1:'⚀', 2:'⚁', 3:'⚂', 4:'⚃', 5:'⚄', 6:'⚅' };

export function SnakesLadders({ config }: { config: GameConfig }) {
  const { p1Name, p2Name, vsAI, onWin } = config;
  const [positions, setPositions] = useState<[number,number]>([0, 0]);
  const [current, setCurrent] = useState<0|1>(0);
  const [dice, setDice] = useState<number>(1);
  const [rolling, setRolling] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState('Press 🎲 to start!');
  const ended = useRef(false);

  // Build board array (100→1 snake order)
  const buildBoard = () => {
    const cells: React.ReactElement[] = [];
    for (let row = 9; row >= 0; row--) {
      const isEvenRow = (9 - row) % 2 === 0;
      const cols = isEvenRow
        ? Array.from({ length: 10 }, (_, i) => row * 10 + i + 1)
        : Array.from({ length: 10 }, (_, i) => row * 10 + 10 - i);
      cells.push(...cols.map(n => {
        const p1Here = positions[0] === n;
        const p2Here = positions[1] === n;
        const isSnake = SNAKES[n] !== undefined;
        const isLadder = LADDERS[n] !== undefined;
        return (
          <div
            key={n}
            className={`snl-cell${isSnake ? ' snake' : ''}${isLadder ? ' ladder' : ''}${n === TOTAL ? ' end' : ''}${n === 1 ? ' start' : ''}`}
          >
            <span style={{ fontSize: '0.35rem', color: 'var(--text-muted)', lineHeight: 1 }}>{n}</span>
            {isSnake && <span style={{ fontSize: '0.7rem' }}>🐍</span>}
            {isLadder && <span style={{ fontSize: '0.7rem' }}>🪜</span>}
            {p1Here && <div className="snl-pawn p1" />}
            {p2Here && <div className="snl-pawn p2" />}
          </div>
        );
      }));
    }
    return cells;
  };

  const doRoll = useCallback(() => {
    if (gameOver || rolling) return;
    setRolling(true);
    AudioManager.play('dice');

    // Animate dice
    let ticks = 0;
    const interval = setInterval(() => {
      setDice(rollDice());
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        const finalRoll = rollDice();
        setDice(finalRoll);
        setRolling(false);

        setPositions(prev => {
          const pos = [...prev] as [number,number];
          let newPos = pos[current] + finalRoll;

          let msg = `${current === 0 ? p1Name : p2Name} rolled ${finalRoll}`;

          if (newPos > TOTAL) {
            newPos = pos[current]; // bounce back
            msg += ' — too far! No move.';
          } else {
            if (SNAKES[newPos]) {
              msg += ` 🐍 Snake! ${newPos}→${SNAKES[newPos]}`;
              newPos = SNAKES[newPos];
              AudioManager.play('error');
            } else if (LADDERS[newPos]) {
              msg += ` 🪜 Ladder! ${newPos}→${LADDERS[newPos]}`;
              newPos = LADDERS[newPos];
              AudioManager.play('coin');
            }
          }

          pos[current] = newPos;
          setStatus(msg);

          if (newPos >= TOTAL && !ended.current) {
            ended.current = true;
            setGameOver(true);
            const winnerName = current === 0 ? p1Name : p2Name;
            setTimeout(() => onWin(winnerName, current === 0 ? 20 : null), 600);
            return pos;
          }

          const next: 0|1 = current === 0 ? 1 : 0;
          setCurrent(next);

          if (vsAI && next === 1 && !ended.current) {
            setTimeout(() => doRoll(), 900);
          }

          return pos;
        });
      }
    }, 60);
  }, [current, gameOver, rolling, p1Name, p2Name, onWin, vsAI]);

  return (
    <div className="snl-wrapper">
      {/* Players */}
      <div className="snl-players">
        <span className="snl-player-p1">🔵 {p1Name}: {positions[0]}</span>
        <span className="snl-player-p2">🔴 {p2Name}: {positions[1]}</span>
      </div>

      {/* Board */}
      <div className="snl-board">{buildBoard()}</div>

      {/* Controls */}
      <div className="snl-controls">
        <div
          className={`snl-dice${rolling ? ' rolling' : ''}`}
          onClick={doRoll}
          title="Roll dice"
        >
          {DICE_FACE[dice]}
        </div>
        <div className="snl-status">{status}</div>
        {!vsAI && (
          <div className="font-pixel" style={{ fontSize: '0.5rem', color: current === 0 ? 'var(--p1)' : 'var(--p2)' }}>
            {current === 0 ? p1Name : p2Name}'S TURN
          </div>
        )}
      </div>
    </div>
  );
}

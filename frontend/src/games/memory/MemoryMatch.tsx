import { useState, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const EMOJIS = ['🎮','👾','🕹️','🤖','🎯','🚀','💎','🌟','🔥','⚡','🍄','🧊','🐲','🦊','🐸','🦄'];
const GRID_SIZES = [4, 4]; // 4×4 = 16 cards = 8 pairs

function makeDeck(cols: number): string[] {
  const count = (cols * cols) / 2;
  const chosen = EMOJIS.slice(0, count);
  const deck = [...chosen, ...chosen];
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function MemoryMatch({ config }: { config: GameConfig }) {
  const { p1Name, p2Name, vsAI, onWin, onDraw } = config;
  const [cols] = useState(GRID_SIZES[0]);
  const [deck] = useState(() => makeDeck(cols));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [current, setCurrent] = useState<1|2>(1);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const ended = useRef(false);

  // AI memory: remembers seen cards
  const aiMemory = useRef<Map<string, number[]>>(new Map()); // emoji → [indices]
  const aiSeen = useRef<Set<number>>(new Set());

  const doFlip = useCallback((idx: number) => {
    if (locked || flipped.includes(idx) || matched.has(idx) || gameOver) return;

    // AI tracks seen cards
    if (vsAI) {
      aiSeen.current.add(idx);
      const e = deck[idx];
      const existing = aiMemory.current.get(e) || [];
      if (!existing.includes(idx)) {
        aiMemory.current.set(e, [...existing, idx]);
      }
    }

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    AudioManager.play('flip');

    if (newFlipped.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (deck[a] === deck[b]) {
        // Match!
        AudioManager.play('match');
        const newMatched = new Set(matched);
        newMatched.add(a);
        newMatched.add(b);
        setMatched(newMatched);
        setScores(prev => ({ ...prev, [current]: prev[current] + 1 }));
        setFlipped([]);
        setLocked(false);

        const newScore = scores[current] + 1;
        if (newMatched.size === deck.length && !ended.current) {
          ended.current = true;
          setGameOver(true);
          const p1Score = current === 1 ? newScore : scores[1];
          const p2Score = current === 2 ? newScore : scores[2];
          setTimeout(() => {
            if (p1Score > p2Score) onWin(p1Name, 16);
            else if (p2Score > p1Score) onWin(p2Name, null);
            else onDraw();
          }, 500);
        } else if (vsAI && current === 2) {
          // AI gets another turn after match
          setTimeout(() => aiTurn(newMatched, newFlipped), 600);
        }
      } else {
        // No match
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
          const next: 1|2 = current === 1 ? 2 : 1;
          setCurrent(next);
          if (vsAI && next === 2 && !ended.current) {
            setTimeout(() => aiTurn(matched, []), 400);
          }
        }, 900);
      }
    }
  }, [locked, flipped, matched, gameOver, deck, current, scores, p1Name, p2Name, onWin, onDraw, vsAI]);

  function aiTurn(currentMatched: Set<number>, currentFlipped: number[]) {
    if (ended.current) return;
    const available = deck.map((_, i) => i).filter(i => !currentMatched.has(i) && !currentFlipped.includes(i));
    if (available.length === 0) return;

    // Check if AI remembers a pair
    let pick1 = -1, pick2 = -1;
    for (const [, indices] of aiMemory.current) {
      const avail = indices.filter(i => !currentMatched.has(i));
      if (avail.length >= 2) { pick1 = avail[0]; pick2 = avail[1]; break; }
    }

    if (pick1 === -1) {
      // Random from seen, else random
      const seenAvail = [...aiSeen.current].filter(i => !currentMatched.has(i));
      pick1 = seenAvail.length > 0
        ? seenAvail[Math.floor(Math.random() * seenAvail.length)]
        : available[Math.floor(Math.random() * available.length)];
    }

    // Flip first
    setTimeout(() => {
      doFlip(pick1);
      setTimeout(() => {
        if (pick2 === -1) {
          const avail2 = available.filter(i => i !== pick1);
          pick2 = avail2[Math.floor(Math.random() * avail2.length)];
        }
        if (pick2 !== -1) doFlip(pick2);
      }, 600);
    }, 300);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stats */}
      <div className="memory-stats">
        <div>{p1Name}: <span>{scores[1]}</span> pairs</div>
        {!vsAI && <div>{p2Name}: <span>{scores[2]}</span> pairs</div>}
        <div>Moves: <span>{moves}</span></div>
      </div>

      {/* Turn */}
      <div className="font-pixel" style={{ fontSize: '0.55rem', color: current === 1 ? 'var(--p1)' : 'var(--p2)' }}>
        {gameOver ? 'GAME OVER!' : `${current === 1 ? p1Name : (vsAI ? 'COMPUTER' : p2Name)}'S TURN`}
      </div>

      {/* Grid */}
      <div
        className="memory-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          width: `${cols * 72 + (cols - 1) * 8}px`,
          maxWidth: '100%',
        }}
      >
        {deck.map((emoji, i) => {
          const isFlipped = flipped.includes(i) || matched.has(i);
          const isMatched = matched.has(i);
          return (
            <div
              key={i}
              className={`memory-card${isFlipped ? ' flipped' : ''}${isMatched ? ' matched' : ''}`}
              style={{ width: '64px', height: '64px', cursor: isFlipped || gameOver ? 'default' : 'pointer' }}
              onClick={() => !isFlipped && !gameOver && (vsAI ? current === 1 : true) && doFlip(i)}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">?</div>
                <div className="memory-card-back">{emoji}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const PADS = [
  { id: 0, color: 'green',  freq: 415.3, label: 'GREEN',  key: '1', bg: '#008844', activeBg: '#00ff66' },
  { id: 1, color: 'red',    freq: 310.0, label: 'RED',    key: '2', bg: '#991122', activeBg: '#ff2244' },
  { id: 2, color: 'yellow', freq: 252.0, label: 'YELLOW', key: '3', bg: '#b89600', activeBg: '#ffee00' },
  { id: 3, color: 'blue',   freq: 209.3, label: 'BLUE',   key: '4', bg: '#0055aa', activeBg: '#0099ff' },
];

export function SimonSays({ config }: { config: GameConfig }) {
  const { p1Name, onWin } = config;
  const [round, setRound] = useState(1);
  const [bestRound, setBestRound] = useState(() => {
    try { return parseInt(localStorage.getItem('retrohub_simon_best') || '1', 10); } catch { return 1; }
  });
  const [status, setStatus] = useState('WATCH!');
  const [activePad, setActivePad] = useState<number | null>(null);
  const [isComputerTurn, setIsComputerTurn] = useState(false);

  const gameState = useRef({
    sequence: [] as number[],
    step: 0,
    round: 1,
    gameOver: false,
  });

  const flashPad = useCallback((padId: number, durMs = 280) => {
    setActivePad(padId);
    AudioManager.play('select');
    setTimeout(() => {
      setActivePad(null);
    }, durMs);
  }, []);

  const playSequence = useCallback((seq: number[], curRound: number) => {
    setIsComputerTurn(true);
    setStatus('WATCH!');
    gameState.current.step = 0;

    const baseSpeed = Math.max(220, 500 - curRound * 25);
    const stepGap = baseSpeed + 120;

    seq.forEach((padId, index) => {
      setTimeout(() => {
        if (!gameState.current.gameOver) {
          flashPad(padId, baseSpeed);
          if (index === seq.length - 1) {
            setTimeout(() => {
              setIsComputerTurn(false);
              setStatus('YOUR TURN!');
            }, baseSpeed + 100);
          }
        }
      }, index * stepGap + 400);
    });
  }, [flashPad]);

  const initGame = useCallback(() => {
    gameState.current.gameOver = false;
    gameState.current.round = 1;
    gameState.current.step = 0;
    const initialSeq = [Math.floor(Math.random() * 4)];
    gameState.current.sequence = initialSeq;
    setRound(1);
    playSequence(initialSeq, 1);
  }, [playSequence]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handlePadPress = useCallback((padId: number) => {
    if (isComputerTurn || gameState.current.gameOver) return;

    flashPad(padId, 220);

    const s = gameState.current;
    if (padId === s.sequence[s.step]) {
      s.step++;
      if (s.step === s.sequence.length) {
        // Round passed
        const nextRound = s.round + 1;
        s.round = nextRound;
        setRound(nextRound);
        setBestRound(b => {
          const nb = Math.max(b, nextRound);
          try { localStorage.setItem('retrohub_simon_best', String(nb)); } catch {}
          return nb;
        });
        setStatus('PERFECT!');
        AudioManager.play('capture');

        const nextPad = Math.floor(Math.random() * 4);
        s.sequence.push(nextPad);
        setTimeout(() => {
          if (!s.gameOver) playSequence(s.sequence, nextRound);
        }, 800);
      }
    } else {
      // Wrong pad
      s.gameOver = true;
      setStatus('WRONG!');
      AudioManager.play('error');
      const won = s.round >= 6;
      const coins = Math.min(30, s.round * 2 + (won ? 8 : 1));
      setTimeout(() => {
        onWin(won ? p1Name : 'GAME OVER', coins);
      }, 500);
    }
  }, [isComputerTurn, flashPad, playSequence, onWin, p1Name]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isComputerTurn || gameState.current.gameOver) return;
      const keyMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (e.key in keyMap) {
        handlePadPress(keyMap[e.key]);
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isComputerTurn, handlePadPress]);

  return (
    <div className="flex flex-col items-center max-w-sm w-full mx-auto select-none">
      <div className="w-full flex justify-between items-center p-3 mb-4 card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>ROUND</div>
          <div className="font-tech text-xl font-bold" style={{ color: 'var(--accent1)' }}>{round}</div>
        </div>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>STATUS</div>
          <div className="font-pixel text-xs" style={{ color: isComputerTurn ? 'var(--accent2)' : 'var(--accent3)' }}>{status}</div>
        </div>
        <div className="text-center">
          <div className="font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>RECORD</div>
          <div className="font-tech text-xl font-bold" style={{ color: 'var(--accent3)' }}>{bestRound}</div>
        </div>
      </div>

      <div className="relative w-72 h-72 rounded-full border-8 border-gray-800 grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-[#111118] shadow-2xl">
        {PADS.map((pad) => {
          const isActive = activePad === pad.id;
          const cornerClass =
            pad.id === 0 ? 'rounded-tl-full' :
            pad.id === 1 ? 'rounded-tr-full' :
            pad.id === 2 ? 'rounded-bl-full' : 'rounded-br-full';

          return (
            <button
              key={pad.id}
              onClick={() => handlePadPress(pad.id)}
              disabled={isComputerTurn}
              className={`border-none transition-all duration-75 relative flex items-center justify-center cursor-pointer ${cornerClass}`}
              style={{
                backgroundColor: isActive ? pad.activeBg : pad.bg,
                boxShadow: isActive ? `0 0 30px ${pad.activeBg}` : 'none',
                filter: isActive ? 'brightness(1.4)' : 'none',
              }}
            >
              <span className="font-pixel text-white/30 text-xs">{pad.key}</span>
            </button>
          );
        })}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[#1a1a24] border-4 border-gray-700 flex flex-col items-center justify-center shadow-xl gap-1">
          <div className="font-pixel text-[8px] text-white tracking-widest">SIMON</div>
          <div className="font-vt text-2xl text-red-500 bg-black px-2 py-0.5 rounded border border-gray-700 leading-none">
            {String(round).padStart(2, '0')}
          </div>
          <button onClick={initGame} className="font-pixel text-[6px] text-white/70 hover:text-white cursor-pointer">
            ↺ REPLAY
          </button>
        </div>
      </div>

      <div className="mt-4 font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>
        TAP THE COLOR PADS OR USE KEYS 1, 2, 3, 4
      </div>
    </div>
  );
}

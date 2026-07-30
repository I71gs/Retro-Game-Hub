import { useState, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const WORD_LIST = [
  'REACT','VITE','TYPESCRIPT','PIXEL','RETRO','GAME','CODE','NEON',
  'ZUSTAND','ROUTER','CANVAS','ARCADE','QUEST','LEVEL','SCORE',
  'AVATAR','COINS','BATTLE','CASTLE','DRAGON','KNIGHT','WIZARD',
  'TETRIS','PONG','MEMORY','DOTS','MATRIX','VECTOR','SPRITE',
];

const MAX_WRONG = 6;

function pickWord(): string {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

const CATEGORIES: Record<string, string> = {
  REACT: 'Framework', VITE: 'Build Tool', TYPESCRIPT: 'Language', PIXEL: 'Art Style',
  RETRO: 'Aesthetic', GAME: 'Entertainment', CODE: 'Programming', NEON: 'Color Style',
  ZUSTAND: 'State Mgmt', ROUTER: 'Navigation', CANVAS: 'Graphics', ARCADE: 'Game Genre',
  QUEST: 'Game Type', LEVEL: 'Game Stage', SCORE: 'Points', AVATAR: 'Character',
  COINS: 'Currency', BATTLE: 'Combat', CASTLE: 'Structure', DRAGON: 'Creature',
  KNIGHT: 'Fighter', WIZARD: 'Spellcaster', TETRIS: 'Classic Game', PONG: 'Classic Game',
  MEMORY: 'Game Type', DOTS: 'Game Type', MATRIX: 'Grid', VECTOR: 'Math', SPRITE: 'Graphics',
};

export function Hangman({ config }: { config: GameConfig }) {
  const { p1Name } = config;
  const [word] = useState(pickWord);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const ended = useRef(false);

  const wrongLetters = Array.from(guessed).filter(l => !word.includes(l));
  const wrong = wrongLetters.length;
  const won = word.split('').every(l => guessed.has(l));

  const guess = useCallback((letter: string) => {
    if (gameOver || guessed.has(letter) || ended.current) return;

    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);

    const isCorrect = word.includes(letter);
    AudioManager.play(isCorrect ? 'guess-correct' : 'guess-wrong');

    const newWrong = Array.from(newGuessed).filter(l => !word.includes(l)).length;
    const newWon = word.split('').every(l => newGuessed.has(l));

    if (newWon && !ended.current) {
      ended.current = true;
      setGameOver(true);
      setTimeout(() => config.onWin(p1Name, 14), 600);
    } else if (newWrong >= MAX_WRONG && !ended.current) {
      ended.current = true;
      setGameOver(true);
      setTimeout(() => config.onDraw(), 600);
    }
  }, [gameOver, guessed, word, p1Name, config]);

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // SVG body parts appear progressively
  const parts = [
    <line key="rope" x1="100" y1="20" x2="100" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>,
    <circle key="head" cx="100" cy="50" r="15" fill="none" stroke="var(--accent2)" strokeWidth="3"/>,
    <line key="body" x1="100" y1="65" x2="100" y2="110" stroke="var(--text-secondary)" strokeWidth="3" strokeLinecap="round"/>,
    <line key="arm-l" x1="100" y1="75" x2="75" y2="95" stroke="var(--text-secondary)" strokeWidth="3" strokeLinecap="round"/>,
    <line key="arm-r" x1="100" y1="75" x2="125" y2="95" stroke="var(--text-secondary)" strokeWidth="3" strokeLinecap="round"/>,
    <line key="leg-l" x1="100" y1="110" x2="75" y2="135" stroke="var(--text-secondary)" strokeWidth="3" strokeLinecap="round"/>,
    <line key="leg-r" x1="100" y1="110" x2="125" y2="135" stroke="var(--text-secondary)" strokeWidth="3" strokeLinecap="round"/>,
  ];

  return (
    <div className="hangman-wrapper">
      {/* SVG gallows + figure */}
      <svg className="hangman-svg" width="180" height="160" style={{ color: 'var(--border)' }}>
        {/* Gallows */}
        <line x1="20" y1="155" x2="160" y2="155" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <line x1="50" y1="155" x2="50" y2="10" stroke="currentColor" strokeWidth="3"/>
        <line x1="50" y1="10" x2="100" y2="10" stroke="currentColor" strokeWidth="3"/>
        <line x1="100" y1="10" x2="100" y2="20" stroke="currentColor" strokeWidth="3"/>
        {/* Progressive body parts */}
        {parts.slice(0, wrong)}
        {/* Win face */}
        {won && (
          <>
            <circle cx="100" cy="50" r="15" fill="none" stroke="var(--accent4)" strokeWidth="3"/>
            <path d="M 92 55 Q 100 62 108 55" fill="none" stroke="var(--accent4)" strokeWidth="2"/>
            <circle cx="94" cy="46" r="2" fill="var(--accent4)"/>
            <circle cx="106" cy="46" r="2" fill="var(--accent4)"/>
          </>
        )}
      </svg>

      {/* Category hint */}
      <div className="hangman-hint">
        Category: {CATEGORIES[word] || 'Mystery'}
      </div>

      {/* Word display */}
      <div className="hangman-word">
        {word.split('').map((l, i) => (
          <div key={i} className="hangman-letter">
            {guessed.has(l)
              ? l
              : (gameOver && !won ? <span style={{ color: 'var(--accent2)' }}>{l}</span> : '')}
          </div>
        ))}
      </div>

      {/* Mistakes */}
      <div className="hangman-mistakes">
        MISTAKES: {wrong} / {MAX_WRONG}
      </div>

      {/* Keyboard */}
      <div className="hangman-keyboard">
        {ALPHA.map(l => (
          <button
            key={l}
            className={`hangman-key${guessed.has(l) ? (word.includes(l) ? ' correct' : ' wrong') : ''}`}
            onClick={() => guess(l)}
            disabled={guessed.has(l) || gameOver}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

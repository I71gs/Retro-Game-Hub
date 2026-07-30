import { useNavigate } from 'react-router-dom';
import type { GameMeta } from '../types';
import { AudioManager } from '../services/AudioManager';
import { motion } from 'framer-motion';

interface GameCardProps {
  game: GameMeta;
}

function PreviewArt({ type }: { type: string }) {
  switch (type) {
    case 'ttt':
      return (
        <div className="ttt-preview">
          {['X','','O','','X','','O','','X'].map((c, i) => <span key={i}>{c}</span>)}
        </div>
      );
    case 'tetris':
      return (
        <div className="tetris-preview">
          {['e','e','i','e','e','t','t','t','e','e','e','e'].map((c, i) => (
            <div key={i} className={`tp ${c}`} />
          ))}
        </div>
      );
    case 'c4':
      return (
        <div className="c4-preview">
          {Array(42).fill('e').map((_, i) => {
            const cls = [28,32,34,35,36,39,40,41].includes(i) ? (i%2===0?'r':'b') : 'e';
            return <div key={i} className={`c4p ${cls}`} />;
          })}
        </div>
      );
    case 'bs':
      return (
        <div className="bs-preview">
          {['s','s','h','e','e','e','e','m','e','s','s','e','e','h','s','s','m','e','e','s','e','e','e','h','e'].map((c, i) => (
            <div key={i} className={`bsp ${c}`} />
          ))}
        </div>
      );
    case 'pong':
      return <div className="pong-preview"><div className="pong-prev-paddle"/><div className="pong-prev-ball"/><div className="pong-prev-paddle"/></div>;
    case 'dots':
      return (
        <div className="dots-preview">
          <div className="dp-dot"/><div className="dp-line h"/><div className="dp-dot"/><div className="dp-line h"/><div className="dp-dot"/>
          <div className="dp-line v"/><div className="dp-box filled"/><div className="dp-line v"/><div className="dp-box"/><div className="dp-line v"/>
          <div className="dp-dot"/><div className="dp-line h"/><div className="dp-dot"/><div className="dp-line h"/><div className="dp-dot"/>
        </div>
      );
    case 'snl':
      return (
        <div className="snl-preview">
          {[{c:'s',e:'🐍'},{c:'',e:''},{c:'',e:''},{c:'',e:''},{c:'l',e:'🪜'},{c:'',e:''},{c:'',e:''},{c:'',e:''},{c:'s2',e:'🐍'}].map((x,i)=>(
            <div key={i} className={`snl-cell ${x.c}`}>{x.e}</div>
          ))}
        </div>
      );
    case 'hangman':
      return (
        <div className="hangman-preview">
          <div className="hm-gallow">
            <div className="hm-post-v"/><div className="hm-post-h"/>
            <div className="hm-rope"/><div className="hm-head"/><div className="hm-body"/>
          </div>
          <div className="hm-word">_ _ _ _ _</div>
        </div>
      );
    case 'memory':
      return (
        <div className="memory-preview">
          {['🎮','?','🎮','?','?','👾','?','👾','?'].map((c,i)=>(
            <div key={i} className={`mem-card ${c!=='?'?'flipped':''}`}>{c}</div>
          ))}
        </div>
      );
    default:
      return <div className="text-4xl text-center">🎮</div>;
  }
}

export function GameCard({ game }: GameCardProps) {
  const navigate = useNavigate();

  function handlePlay() {
    AudioManager.play('select');
    navigate(`/game/${game.id}`);
  }

  return (
    <motion.div
      className="card relative overflow-hidden cursor-pointer flex flex-col"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handlePlay}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '0',
      }}
    >
      {/* Art area */}
      <div
        className="flex items-center justify-center"
        style={{
          height: '130px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
          }}
        />
        <PreviewArt type={game.previewType} />
      </div>

      {/* Info area */}
      <div className="flex flex-col gap-1 p-4 flex-1">
        <div className="font-pixel text-xs" style={{ color: 'var(--text-primary)', fontSize: '0.65rem' }}>
          {game.name}
        </div>
        <div className="font-ui text-xs" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.4 }}>
          {game.description}
        </div>
        <div className="font-pixel mt-auto" style={{ color: 'var(--accent3)', fontSize: '0.5rem' }}>
          🪙 +{game.coinsPerWin} per win
        </div>
      </div>

      {/* Play button */}
      <div className="px-4 pb-4">
        <button
          className="retro-btn w-full text-center"
          onClick={(e) => { e.stopPropagation(); handlePlay(); }}
        >
          ► PLAY
        </button>
      </div>
    </motion.div>
  );
}

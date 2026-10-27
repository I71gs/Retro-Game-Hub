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
    case 'snake':
      return (
        <div className="grid grid-cols-7 gap-0.5 p-1 bg-[#0a0a14] rounded">
          {Array(49).fill(0).map((_, i) => {
            const isHead = i === 11;
            const isBody = [9, 10, 16, 23, 24, 25].includes(i);
            const isFood = i === 12;
            return (
              <div
                key={i}
                className={`w-3 h-3 rounded-xs ${
                  isHead ? 'bg-[#00ffaa] shadow-sm shadow-[#00ffaa]' :
                  isBody ? 'bg-[#00bb77]' :
                  isFood ? 'bg-[#ff2255] rounded-full' : 'bg-[#121222]'
                }`}
              />
            );
          })}
        </div>
      );
    case 'game2048':
      return (
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#181828] rounded">
          {['2','4','8','16','64','2','8','2048','4'].map((val, i) => (
            <div
              key={i}
              className={`w-7 h-7 flex items-center justify-center font-pixel text-[8px] font-bold rounded ${
                val === '2048' ? 'bg-[#ffd700] text-black text-[6px]' :
                ['8','16','64'].includes(val) ? 'bg-[#ff3366] text-white' : 'bg-[#2b395e] text-[#00ffcc]'
              }`}
            >
              {val}
            </div>
          ))}
        </div>
      );
    case 'breakout':
      return (
        <div className="w-28 h-20 bg-[#0a0a14] p-1 rounded relative flex flex-col items-center">
          <div className="flex gap-1 mb-1">
            <div className="w-4 h-1.5 bg-[#ff2255] rounded-xs" /><div className="w-4 h-1.5 bg-[#ff2255] rounded-xs" /><div className="w-4 h-1.5 bg-[#ff2255] rounded-xs" /><div className="w-4 h-1.5 bg-[#ff2255] rounded-xs" /><div className="w-4 h-1.5 bg-[#ff2255] rounded-xs" />
          </div>
          <div className="flex gap-1 mb-1">
            <div className="w-4 h-1.5 bg-[#ff7700] rounded-xs" /><div className="w-4 h-1.5 bg-[#ff7700] rounded-xs" /><div className="w-4 h-1.5 bg-[#ff7700] rounded-xs" /><div className="w-4 h-1.5 bg-[#ff7700] rounded-xs" /><div className="w-4 h-1.5 bg-[#ff7700] rounded-xs" />
          </div>
          <div className="flex gap-1">
            <div className="w-4 h-1.5 bg-[#00ffaa] rounded-xs" /><div className="w-4 h-1.5 bg-[#00ffaa] rounded-xs" /><div className="w-4 h-1.5 bg-[#00ffaa] rounded-xs" /><div className="w-4 h-1.5 bg-[#00ffaa] rounded-xs" /><div className="w-4 h-1.5 bg-[#00ffaa] rounded-xs" />
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff0066] absolute bottom-4 left-12 shadow-sm shadow-[#ff0066]" />
          <div className="w-8 h-1 bg-[#00ffaa] rounded-xs absolute bottom-1 left-9 shadow-sm shadow-[#00ffaa]" />
        </div>
      );
    case 'minesweeper':
      return (
        <div className="grid grid-cols-3 gap-0.5 p-1 bg-[#222230] rounded">
          {['1','2','🚩','','1','','','💣','1'].map((c, i) => (
            <div
              key={i}
              className={`w-6 h-6 flex items-center justify-center font-pixel text-[9px] rounded-xs ${
                ['1','2',''].includes(c) ? 'bg-[#1a1a24] text-[#00e5ff]' : 'bg-[#333345] text-white'
              }`}
            >
              {c}
            </div>
          ))}
        </div>
      );
    case 'simon':
      return (
        <div className="w-16 h-16 rounded-full bg-[#111] p-1 grid grid-cols-2 grid-rows-2 gap-1 relative shadow-sm">
          <div className="bg-[#00cc66] rounded-tl-full" />
          <div className="bg-[#ee2244] rounded-tr-full" />
          <div className="bg-[#ffcc00] rounded-bl-full" />
          <div className="bg-[#1177ee] rounded-br-full" />
          <div className="w-5 h-5 rounded-full bg-[#1a1a24] border border-gray-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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

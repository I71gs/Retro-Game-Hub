import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { AudioManager } from '../services/AudioManager';
import { HUDBar } from '../components/HUDBar';
import type { Player } from '../types';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'all', label: 'ALL TIME' },
  { id: 'ttt', label: 'TIC-TAC-TOE' },
  { id: 'dots', label: 'DOTS' },
  { id: 'c4', label: 'CONNECT 4' },
  { id: 'snl', label: 'SNAKES' },
  { id: 'bs', label: 'BATTLESHIP' },
  { id: 'hangman', label: 'HANGMAN' },
  { id: 'memory', label: 'MEMORY' },
  { id: 'tetris', label: 'TETRIS' },
  { id: 'pong', label: 'PONG' },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardPage() {
  const navigate = useNavigate();
  const getLeaderboard = usePlayerStore((s) => s.getLeaderboard);
  const [tab, setTab] = useState('all');

  const players = getLeaderboard(tab);

  function getScore(p: Player): number {
    if (tab === 'all') return p.coins;
    return (p.wins[tab as keyof typeof p.wins] as number) || 0;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <HUDBar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-6">
            <button className="retro-btn small secondary" onClick={() => { AudioManager.play('click'); navigate('/dashboard'); }}>
              ◄ BACK
            </button>
            <h1 className="font-pixel" style={{ color: 'var(--accent3)', fontSize: '0.8rem' }}>
              🏆 HALL OF FAME
            </h1>
          </div>

          {/* Tab bar */}
          <div
            className="flex gap-1 flex-wrap mb-6"
            style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                className="font-pixel transition-all px-3 py-1 rounded"
                style={{
                  fontSize: '0.45rem',
                  background: tab === t.id ? 'var(--accent1)' : 'transparent',
                  color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: tab === t.id ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onClick={() => { setTab(t.id); AudioManager.play('click'); }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Players list */}
          <div className="flex flex-col gap-2">
            {players.length === 0 && (
              <p className="text-center font-pixel" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', padding: '40px' }}>
                NO DATA YET — BE THE FIRST!
              </p>
            )}
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                className="card flex items-center gap-4 p-4"
                style={{ background: i < 3 ? 'var(--bg-card-hover)' : 'var(--bg-card)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                {/* Rank */}
                <div
                  className="font-pixel min-w-8 text-center"
                  style={{ fontSize: i < 3 ? '1.4rem' : '0.8rem', color: 'var(--text-muted)' }}
                >
                  {i < 3 ? RANK_MEDALS[i] : `#${i + 1}`}
                </div>

                {/* Avatar */}
                <span className="text-2xl">{p.avatar}</span>

                {/* Name + Level */}
                <div className="flex-1">
                  <div className="font-pixel" style={{ fontSize: '0.65rem', color: 'var(--text-primary)' }}>
                    {p.id}
                  </div>
                  <div className="font-pixel" style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>
                    LVL {p.level} · {p.wins.total} wins
                  </div>
                </div>

                {/* Score */}
                <div className="font-pixel text-right">
                  <div style={{ fontSize: '0.9rem', color: 'var(--accent3)' }}>
                    {getScore(p)}
                  </div>
                  <div style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>
                    {tab === 'all' ? 'coins' : 'wins'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

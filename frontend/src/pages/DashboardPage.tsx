import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';
import { AudioManager } from '../services/AudioManager';
import { HUDBar } from '../components/HUDBar';
import { GameCard } from '../components/GameCard';
import { GAME_REGISTRY } from '../games/registry';
import { motion } from 'framer-motion';

export function DashboardPage() {
  const navigate = useNavigate();
  const currentPlayer = usePlayerStore((s) => s.currentPlayer);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);

  useEffect(() => {
    if (!currentPlayer) { navigate('/player'); return; }
    if (musicEnabled) AudioManager.playMusic('home');
  }, [currentPlayer, musicEnabled, navigate]);

  if (!currentPlayer) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <HUDBar />

      <main className="flex-1 py-8 page-container">
        {/* Title */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="font-tech font-black tracking-wider"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--text-primary)' }}
          >
            <span style={{ color: 'var(--accent1)' }}>RETRO</span>{' '}
            <span style={{ color: 'var(--accent3)' }}>GAME HUB</span>
          </h1>
          <p className="font-retro mt-2" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
            Notebook classics, digitally reborn
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { label: 'COINS', value: currentPlayer.coins, icon: '🪙' },
            { label: 'WIN STREAK', value: currentPlayer.streak, icon: '🔥' },
            { label: 'TOTAL WINS', value: currentPlayer.wins.total, icon: '🏆' },
            { label: 'GAMES PLAYED', value: currentPlayer.games.total, icon: '🎮' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card p-4 text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div style={{ fontSize: '1.5rem' }}>{stat.icon}</div>
              <div className="font-pixel mt-1" style={{ color: 'var(--accent3)', fontSize: '1.1rem' }}>
                {stat.value}
              </div>
              <div className="font-pixel mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.4rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Game Grid */}
        <div>
          <h2
            className="font-pixel mb-5"
            style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', letterSpacing: '0.15em' }}
          >
            ► SELECT GAME
          </h2>
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            }}
          >
            {GAME_REGISTRY.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
              >
                <GameCard game={game} />
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

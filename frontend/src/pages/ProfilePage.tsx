import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { AudioManager } from '../services/AudioManager';
import { HUDBar } from '../components/HUDBar';
import { api } from '../services/api';
import type { AnalyticsSummary, UserAchievementItem } from '../types/api';
import { motion } from 'framer-motion';

export function ProfilePage() {
  const navigate = useNavigate();
  const currentPlayer = usePlayerStore((s) => s.currentPlayer);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [achievements, setAchievements] = useState<UserAchievementItem[]>([]);

  useEffect(() => {
    if (!currentPlayer) {
      navigate('/player');
      return;
    }

    async function loadData() {
      try {
        if (currentPlayer && currentPlayer.id !== 'GUEST') {
          const data = await api.getUserAnalytics(currentPlayer.id);
          const achs = await api.getUserAchievements(currentPlayer.id);
          setAnalytics(data);
          setAchievements(achs);
        }
      } catch (err) {
        console.warn('Backend unavailable, using local metrics', err);
      }
    }

    loadData();
  }, [currentPlayer, navigate]);

  if (!currentPlayer) return null;

  const totalGames = analytics ? analytics.totalGames : currentPlayer.games.total;
  const totalWins = analytics ? analytics.totalWins : currentPlayer.wins.total;
  const winRate = analytics ? analytics.winRate : (totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0);
  const bestStreak = analytics ? analytics.bestStreak : currentPlayer.streak;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <HUDBar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button className="retro-btn small secondary" onClick={() => { AudioManager.play('click'); navigate('/dashboard'); }}>
              ◄ DASHBOARD
            </button>
            <h1 className="font-pixel" style={{ color: 'var(--accent3)', fontSize: '0.85rem' }}>
              👤 PLAYER PROFILE & ANALYTICS
            </h1>
          </div>

          {/* Profile Header */}
          <div className="card p-6 flex flex-col sm:flex-row items-center gap-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-5xl p-4 rounded-full" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--accent1)' }}>
              {currentPlayer.avatar}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="font-pixel text-lg" style={{ color: 'var(--accent1)' }}>{currentPlayer.id}</div>
              <div className="font-pixel text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                LEVEL {currentPlayer.level} • {currentPlayer.xp} / {(currentPlayer.level) * 500} XP
              </div>
              {/* XP Progress Bar */}
              <div className="w-full h-3 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(100, ((currentPlayer.xp % 500) / 500) * 100)}%`,
                    background: 'var(--accent3)',
                    boxShadow: '0 0 8px var(--accent3)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'WIN RATE', value: `${winRate}%`, icon: '📊' },
              { label: 'TOTAL GAMES', value: totalGames, icon: '🎮' },
              { label: 'TOTAL WINS', value: totalWins, icon: '🏆' },
              { label: 'BEST STREAK', value: bestStreak, icon: '🔥' },
            ].map((m) => (
              <div key={m.label} className="card p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-2xl">{m.icon}</div>
                <div className="font-pixel text-base mt-1" style={{ color: 'var(--accent3)' }}>{m.value}</div>
                <div className="font-pixel text-xs mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.45rem' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Unlocked Achievements */}
          <section className="card p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-pixel text-xs mb-4" style={{ color: 'var(--accent1)' }}>
              🏅 UNLOCKED ACHIEVEMENTS ({achievements.length})
            </h2>
            {achievements.length === 0 ? (
              <p className="font-pixel text-xs text-center p-6" style={{ color: 'var(--text-muted)' }}>
                PLAY GAMES TO UNLOCK EXCLUSIVE BADGES, XP & COINS!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <span className="text-2xl">{item.achievement.icon}</span>
                    <div>
                      <div className="font-pixel text-xs" style={{ color: 'var(--accent3)', fontSize: '0.6rem' }}>{item.achievement.title}</div>
                      <div className="font-ui text-xs" style={{ color: 'var(--text-secondary)' }}>{item.achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </motion.div>
      </main>
    </div>
  );
}

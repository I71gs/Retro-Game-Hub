import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import { AudioManager } from '../services/AudioManager';

export function HUDBar() {
  const navigate = useNavigate();
  const currentPlayer = usePlayerStore((s) => s.currentPlayer);
  const logout = usePlayerStore((s) => s.logout);
  const currentTrack = useGameStore((s) => s.currentTrack);

  function handleLogout() {
    AudioManager.play('click');
    logout();
    navigate('/player');
  }

  if (!currentPlayer) return null;

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Player Info */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{currentPlayer.avatar}</span>
        <div>
          <p className="font-pixel text-xs" style={{ color: 'var(--accent1)', fontSize: '0.6rem' }}>
            {currentPlayer.id}
          </p>
          <p className="font-pixel" style={{ color: 'var(--text-muted)', fontSize: '0.45rem' }}>
            LVL {currentPlayer.level} · {currentPlayer.xp} XP
          </p>
        </div>
      </div>

      {/* Music Indicator */}
      {currentTrack && (
        <div className="flex items-center gap-2">
          <div className="music-bars">
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </div>
          <span className="font-pixel" style={{ fontSize: '0.45rem', color: 'var(--accent3)' }}>
            {currentTrack.toUpperCase()}
          </span>
        </div>
      )}

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Coins */}
        <div className="flex items-center gap-1">
          <span>🪙</span>
          <span className="font-pixel" style={{ color: 'var(--accent3)', fontSize: '0.7rem' }}>
            {currentPlayer.coins}
          </span>
        </div>

        {/* Leaderboard */}
        <button
          className="text-xl hover:scale-110 transition-transform"
          title="Leaderboard"
          onClick={() => { AudioManager.play('click'); navigate('/leaderboard'); }}
        >🏆</button>

        {/* Settings */}
        <button
          className="text-xl hover:scale-110 transition-transform"
          title="Settings"
          onClick={() => { AudioManager.play('click'); navigate('/settings'); }}
        >⚙️</button>

        {/* Logout */}
        <button
          className="text-xl hover:scale-110 transition-transform"
          title="Logout"
          onClick={handleLogout}
        >⏻</button>
      </div>
    </header>
  );
}

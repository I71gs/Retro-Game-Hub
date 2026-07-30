import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';
import { AudioManager } from '../services/AudioManager';
import { AvatarGrid } from '../components/AvatarGrid';
import { motion } from 'framer-motion';

type Tab = 'login' | 'register';

export function PlayerPage() {
  const navigate = useNavigate();
  const { register, login, loginGuest } = usePlayerStore();
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const [tab, setTab] = useState<Tab>('login');

  // Login state
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginMsg, setLoginMsg] = useState<{ type: 'success'|'error'; text: string } | null>(null);

  // Register state
  const [regId, setRegId] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regAvatar, setRegAvatar] = useState('🎮');
  const [regMsg, setRegMsg] = useState<{ type: 'success'|'error'; text: string } | null>(null);

  useEffect(() => {
    if (musicEnabled) AudioManager.playMusic('login');
    return () => {};
  }, [musicEnabled]);

  function handleLogin() {
    const res = login(loginId, loginPin);
    if (res.ok) {
      setLoginMsg({ type: 'success', text: '✓ Welcome back!' });
      AudioManager.play('select');
      setTimeout(() => navigate('/dashboard'), 700);
    } else {
      setLoginMsg({ type: 'error', text: '✗ ' + res.msg });
      AudioManager.play('error');
    }
  }

  function handleRegister() {
    const res = register(regId, regPin, regAvatar);
    if (res.ok) {
      setRegMsg({ type: 'success', text: '✓ Account created! Welcome!' });
      AudioManager.play('win');
      setTimeout(() => navigate('/dashboard'), 800);
    } else {
      setRegMsg({ type: 'error', text: '✗ ' + res.msg });
      AudioManager.play('error');
    }
  }

  function handleGuest() {
    loginGuest();
    AudioManager.play('click');
    navigate('/dashboard');
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-y-auto py-8"
      style={{ background: 'var(--bg-primary)' }}
    >
      <motion.div
        className="w-full max-w-md mx-4 flex flex-col gap-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-2">
          <div className="pixel-logo justify-center" style={{ fontSize: '1.8rem' }}>
            <span className="logo-r">R</span><span className="logo-e">E</span>
            <span className="logo-t">T</span><span className="logo-r2">R</span>
            <span className="logo-o">O</span>
          </div>
          <div className="font-tech tracking-widest mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            GAME HUB
          </div>
        </div>

        {/* Panel */}
        <div
          className="card p-6 flex flex-col gap-4"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <div className="font-pixel text-center" style={{ color: 'var(--accent1)', fontSize: '0.7rem' }}>
            PLAYER STATION
          </div>

          {/* Tabs */}
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                className="flex-1 py-2 font-pixel transition-all"
                style={{
                  fontSize: '0.55rem',
                  background: tab === t ? 'var(--accent1)' : 'transparent',
                  color: tab === t ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => { setTab(t); AudioManager.play('click'); }}
              >
                {t === 'login' ? 'LOAD SAVE' : 'NEW PLAYER'}
              </button>
            ))}
          </div>

          {/* Login */}
          {tab === 'login' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">PLAYER ID</label>
                <input
                  className="retro-input"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter your ID..."
                  maxLength={16}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div>
                <label className="field-label">PIN (4 digits)</label>
                <input
                  className="retro-input"
                  type="password"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <button className="retro-btn" onClick={handleLogin}>► LOAD GAME</button>
              {loginMsg && <div className={`msg-box ${loginMsg.type}`}>{loginMsg.text}</div>}
            </div>
          )}

          {/* Register */}
          {tab === 'register' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">CHOOSE PLAYER ID</label>
                <input
                  className="retro-input"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="3-16 chars..."
                  maxLength={16}
                />
              </div>
              <div>
                <label className="field-label">CHOOSE AVATAR</label>
                <AvatarGrid selected={regAvatar} onChange={setRegAvatar} />
              </div>
              <div>
                <label className="field-label">SET PIN (4 digits)</label>
                <input
                  className="retro-input"
                  type="password"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>
              <button className="retro-btn" onClick={handleRegister}>► CREATE PLAYER</button>
              {regMsg && <div className={`msg-box ${regMsg.type}`}>{regMsg.text}</div>}
            </div>
          )}

          {/* Guest */}
          <button className="retro-btn secondary" onClick={handleGuest}>
            ▷ PLAY AS GUEST
          </button>
        </div>
      </motion.div>
    </div>
  );
}

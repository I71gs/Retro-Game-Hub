import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { usePlayerStore } from '../store/playerStore';
import { AudioManager } from '../services/AudioManager';
import { HUDBar } from '../components/HUDBar';
import { ConfirmModal } from '../components/Modal';
import type { Settings } from '../types';
import { motion } from 'framer-motion';

const THEMES: { id: Settings['theme']; label: string; colors: string[] }[] = [
  { id: 'default',  label: 'DEFAULT',  colors: ['#6c63ff','#ff6b6b','#ffd93d','#0a0a0f'] },
  { id: 'notebook', label: 'NOTEBOOK', colors: ['#5b4fcf','#c0392b','#d4880c','#f5f0e8'] },
  { id: 'gameboy',  label: 'GAME BOY', colors: ['#9bbc0f','#8bac0f','#306230','#0f380f'] },
  { id: 'neon',     label: 'NEON',     colors: ['#ff00ff','#00ffff','#ffff00','#050510'] },
];

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="font-pixel" style={{ color: 'var(--text-secondary)', fontSize: '0.55rem' }}>
        {label}
      </span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => { onChange(e.target.checked); AudioManager.play('click'); }}
        />
        <span className="toggle-knob" />
      </label>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const { deleteCurrentPlayer, currentPlayer, logout } = usePlayerStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDeleteAccount() {
    deleteCurrentPlayer();
    logout();
    navigate('/player');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <HUDBar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4">
            <button className="retro-btn small secondary" onClick={() => { AudioManager.play('click'); navigate('/dashboard'); }}>
              ◄ BACK
            </button>
            <h1 className="font-pixel" style={{ color: 'var(--accent1)', fontSize: '0.8rem' }}>⚙️ SETTINGS</h1>
          </div>

          {/* Theme */}
          <section className="card p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-pixel mb-4" style={{ color: 'var(--text-secondary)', fontSize: '0.55rem' }}>
              DISPLAY THEME
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { settings.setTheme(t.id); AudioManager.play('click'); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all"
                  style={{
                    border: settings.theme === t.id ? '2px solid var(--accent1)' : '2px solid var(--border)',
                    background: settings.theme === t.id ? 'rgba(108,99,255,0.15)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {/* Color swatches */}
                  <div className="flex gap-1">
                    {t.colors.map((c, i) => (
                      <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <span className="font-pixel" style={{ fontSize: '0.4rem', color: 'var(--text-secondary)' }}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* CRT Effects */}
          <section className="card p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-pixel mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.55rem' }}>
              CRT EFFECTS
            </h2>
            <ToggleRow label="Scanlines" checked={settings.scanlines} onChange={settings.setScanlines} />
            <ToggleRow label="CRT Vignette" checked={settings.vignette} onChange={settings.setVignette} />
            <ToggleRow label="Pixel Font" checked={settings.pixelFont} onChange={settings.setPixelFont} />
          </section>

          {/* Sound */}
          <section className="card p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-pixel mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.55rem' }}>
              SOUND
            </h2>
            <ToggleRow
              label="Sound Effects"
              checked={settings.soundEnabled}
              onChange={(v) => { settings.setSoundEnabled(v); AudioManager.setSfxEnabled(v); }}
            />
            <ToggleRow
              label="Music"
              checked={settings.musicEnabled}
              onChange={(v) => { settings.setMusicEnabled(v); AudioManager.setMusicEnabled(v); }}
            />
          </section>

          {/* Danger Zone */}
          {currentPlayer && currentPlayer.id !== 'GUEST' && (
            <section className="card p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent2)' }}>
              <h2 className="font-pixel mb-4" style={{ color: 'var(--accent2)', fontSize: '0.55rem' }}>
                ⚠️ DANGER ZONE
              </h2>
              <button className="retro-btn danger" onClick={() => setConfirmDelete(true)}>
                DELETE MY ACCOUNT
              </button>
            </section>
          )}
        </motion.div>
      </main>

      <ConfirmModal
        open={confirmDelete}
        title="DELETE ACCOUNT"
        message={`Delete ${currentPlayer?.id}? This cannot be undone!`}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

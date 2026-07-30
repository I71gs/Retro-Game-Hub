import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore, seedDemoData } from '../store/playerStore';
import { AudioManager } from '../services/AudioManager';
import { motion } from 'framer-motion';

const BOOT_MSGS = [
  'LOADING SYSTEM...',
  'INITIALIZING PLAYER DB...',
  'LOADING GAME ASSETS...',
  'CALIBRATING RETRO VIBES...',
  'READY TO PLAY!',
];

export function BootPage() {
  const navigate = useNavigate();
  const currentPlayer = usePlayerStore((s) => s.currentPlayer);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    seedDemoData();
    AudioManager.play('boot');

    intervalRef.current = setInterval(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next >= BOOT_MSGS.length) {
          clearInterval(intervalRef.current!);
          setTimeout(() => setDone(true), 400);
        }
        return next;
      });
    }, 900);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (!done) return;
    if (currentPlayer) {
      navigate('/dashboard');
    } else {
      navigate('/player');
    }
  }, [done, currentPlayer, navigate]);

  function skip() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStep(BOOT_MSGS.length);
    setDone(true);
  }

  const pct = Math.round((step / BOOT_MSGS.length) * 100);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center cursor-pointer"
      style={{ background: 'var(--bg-primary)' }}
      onClick={skip}
      onKeyDown={skip}
      tabIndex={0}
    >
      <motion.div
        className="flex flex-col items-center gap-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center">
          <div className="pixel-logo anim-float">
            <span className="logo-r">R</span>
            <span className="logo-e">E</span>
            <span className="logo-t">T</span>
            <span className="logo-r2">R</span>
            <span className="logo-o">O</span>
          </div>
          <div
            className="font-tech mt-2 tracking-widest"
            style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', letterSpacing: '0.5em' }}
          >
            GAME HUB
          </div>
          <div className="font-pixel mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.45rem' }}>
            v2.0 · © 2025
          </div>
        </div>

        {/* Boot progress */}
        <div className="w-80 flex flex-col gap-3">
          <div
            style={{
              height: '6px',
              background: 'var(--bg-secondary)',
              borderRadius: '3px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'var(--accent1)',
                boxShadow: '0 0 12px var(--accent1)',
                borderRadius: '3px',
              }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div
            className="font-pixel text-center"
            style={{ color: 'var(--text-secondary)', fontSize: '0.55rem' }}
          >
            {BOOT_MSGS[Math.min(step, BOOT_MSGS.length - 1)]}
          </div>
        </div>

        {/* Skip hint */}
        <div
          className="font-pixel anim-blink"
          style={{ color: 'var(--text-muted)', fontSize: '0.5rem' }}
        >
          PRESS ANY KEY OR TAP TO START
        </div>
      </motion.div>
    </div>
  );
}

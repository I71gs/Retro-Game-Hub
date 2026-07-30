import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioManager } from '../services/AudioManager';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) AudioManager.play('select');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="card p-6 flex flex-col gap-4 min-w-72 max-w-sm w-full mx-4"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--accent1)',
              boxShadow: '0 0 40px rgba(108,99,255,0.3)',
            }}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-pixel text-center" style={{ color: 'var(--accent1)', fontSize: '0.8rem' }}>
              {title}
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface WinModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  coins: number | null;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function WinModal({ open, title, subtitle, coins, onPlayAgain, onHome }: WinModalProps) {
  return (
    <Modal open={open} title="">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="anim-float text-4xl">★</div>
        <div className="font-pixel" style={{ color: 'var(--accent3)', fontSize: '1.2rem' }}>
          {title}
        </div>
        <div className="font-ui" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {subtitle}
        </div>
        {coins !== null && (
          <div className="font-pixel" style={{ color: 'var(--accent3)', fontSize: '0.65rem' }}>
            🪙 +{coins} coins awarded!
          </div>
        )}
        <div className="flex gap-3 w-full">
          <button className="retro-btn flex-1" onClick={onPlayAgain}>▶ PLAY AGAIN</button>
          <button className="retro-btn secondary flex-1" onClick={onHome}>⌂ HOME</button>
        </div>
      </div>
    </Modal>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="font-ui text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        {message}
      </div>
      <div className="flex gap-3">
        <button className="retro-btn danger flex-1" onClick={onConfirm}>YES</button>
        <button className="retro-btn secondary flex-1" onClick={onCancel}>NO</button>
      </div>
    </Modal>
  );
}

import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { AudioManager } from '../services/AudioManager';
import { HUDBar } from '../components/HUDBar';
import { WinModal, ConfirmModal } from '../components/Modal';
import { GAME_REGISTRY, GAME_COMPONENTS } from '../games/registry';
import type { GameConfig, WinRecord } from '../types';
import { motion } from 'framer-motion';

interface WinState {
  open: boolean;
  title: string;
  subtitle: string;
  coins: number | null;
}

export function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentPlayer = usePlayerStore((s) => s.currentPlayer);
  const { awardCoins, recordGame } = usePlayerStore();
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);

  const vsAI = useGameStore((s) => s.vsAI);
  const setVsAI = useGameStore((s) => s.setVsAI);

  const [winState, setWinState] = useState<WinState>({ open: false, title: '', subtitle: '', coins: null });
  const [confirmExit, setConfirmExit] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  const game = GAME_REGISTRY.find((g) => g.id === id);
  const GameComponent = id ? GAME_COMPONENTS[id] : null;

  const p1Name = (currentPlayer && currentPlayer.id !== 'GUEST') ? currentPlayer.id : 'PLAYER 1';

  const config: GameConfig = {
    p1Name,
    p2Name: vsAI ? 'COMPUTER' : 'PLAYER 2',
    vsAI: vsAI || (id === 'pong'), // pong always vs AI
    online: false,
    playerIndex: 1,
    onWin: useCallback((winner: string, coins: number | null) => {
      AudioManager.play('win');
      if (winner !== 'draw' && currentPlayer && currentPlayer.id !== 'GUEST') {
        if (coins) awardCoins(coins, (id || 'total') as keyof WinRecord);
        AudioManager.play('coin');
      }
      recordGame((id || 'total') as keyof WinRecord, winner !== 'draw');
      setWinState({
        open: true,
        title: winner === 'draw' ? 'DRAW!' : 'WINNER!',
        subtitle: winner === 'draw' ? "Nobody wins this round..." : `${winner} wins the match!`,
        coins: winner !== 'draw' ? coins : null,
      });
    }, [id, currentPlayer, awardCoins, recordGame]),
    onDraw: useCallback(() => {
      AudioManager.play('draw');
      recordGame((id || 'total') as keyof WinRecord, false);
      setWinState({ open: true, title: 'DRAW!', subtitle: "Nobody wins this round...", coins: null });
    }, [id, recordGame]),
  };

  function handleRestart() {
    AudioManager.play('click');
    setWinState({ open: false, title: '', subtitle: '', coins: null });
    setRestartKey((k) => k + 1);
  }

  function handleExit() {
    AudioManager.play('click');
    setConfirmExit(true);
  }

  function confirmExitGame() {
    navigate('/dashboard');
    if (musicEnabled) AudioManager.playMusic('home');
  }

  function handleToggleAI() {
    AudioManager.play('click');
    setVsAI(!vsAI);
    setRestartKey((k) => k + 1);
  }

  if (!game || !GameComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p className="font-pixel" style={{ color: 'var(--accent2)', fontSize: '0.7rem' }}>GAME NOT FOUND</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <HUDBar />

      {/* Game HUD */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
      >
        <button className="retro-btn small secondary" onClick={handleExit}>◄ EXIT</button>
        <div className="font-pixel" style={{ color: 'var(--accent1)', fontSize: '0.65rem' }}>
          {game.name}
        </div>
        <div className="flex gap-2">
          <button className="retro-btn small" onClick={handleRestart}>↺ RESTART</button>
          {game.supportsAI && id !== 'pong' && (
            <button className="retro-btn small secondary" onClick={handleToggleAI}>
              {vsAI ? '👥 VS HUMAN' : '🤖 VS AI'}
            </button>
          )}
        </div>
      </div>

      {/* Game Area */}
      <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <motion.div
          key={restartKey}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full flex justify-center"
        >
          <GameComponent config={config} key={restartKey} />
        </motion.div>
      </main>

      {/* Win Modal */}
      <WinModal
        open={winState.open}
        title={winState.title}
        subtitle={winState.subtitle}
        coins={winState.coins}
        onPlayAgain={handleRestart}
        onHome={() => { setWinState({ open: false, title:'', subtitle:'', coins: null }); navigate('/dashboard'); }}
      />

      {/* Exit Confirm */}
      <ConfirmModal
        open={confirmExit}
        title="EXIT GAME"
        message="Leave this game?"
        onConfirm={confirmExitGame}
        onCancel={() => setConfirmExit(false)}
      />
    </div>
  );
}

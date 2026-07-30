import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { AudioManager } from '../services/AudioManager';
import { HUDBar } from '../components/HUDBar';
import { api } from '../services/api';
import type { StoreCatalogItem } from '../types/api';
import { motion } from 'framer-motion';

const MOCK_CATALOG: StoreCatalogItem[] = [
  { id: 'av-robot', name: 'Cyber Robot', price: 150, type: 'avatar', rarity: 'rare' },
  { id: 'av-alien', name: 'Retro Alien', price: 250, type: 'avatar', rarity: 'epic' },
  { id: 'th-neon', name: 'Neon Theme', price: 200, type: 'theme', rarity: 'epic' },
  { id: 'th-gameboy', name: 'GameBoy Theme', price: 300, type: 'theme', rarity: 'legendary' },
];

export function StorePage() {
  const navigate = useNavigate();
  const currentPlayer = usePlayerStore((s) => s.currentPlayer);
  const awardCoins = usePlayerStore((s) => s.awardCoins);
  const [catalog, setCatalog] = useState<StoreCatalogItem[]>(MOCK_CATALOG);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!currentPlayer) {
      navigate('/player');
      return;
    }

    async function loadCatalog() {
      try {
        const items = await api.getStoreCatalog();
        if (items.length > 0) setCatalog(items);
      } catch (err) {
        console.warn('Using local store catalog preview', err);
      }
    }

    loadCatalog();
  }, [currentPlayer, navigate]);

  if (!currentPlayer) return null;

  async function handleBuy(item: StoreCatalogItem) {
    if (currentPlayer!.coins < item.price) {
      setMsg({ type: 'error', text: '✗ Insufficient coins!' });
      AudioManager.play('error');
      return;
    }

    try {
      if (currentPlayer!.id !== 'GUEST') {
        await api.buyItem(currentPlayer!.id, item.id);
      }
      awardCoins(-item.price, 'ttt'); // deduct coins
      setMsg({ type: 'success', text: `✓ Purchased ${item.name}!` });
      AudioManager.play('coin');
    } catch (err: any) {
      setMsg({ type: 'error', text: `✗ ${err.message || 'Purchase failed'}` });
      AudioManager.play('error');
    }
  }

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
              🏪 RETRO STORE & REWARDS
            </h1>
          </div>

          {msg && <div className={`msg-box ${msg.type}`}>{msg.text}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {catalog.map((item) => (
              <div key={item.id} className="card p-5 flex flex-col justify-between" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-xs" style={{ color: 'var(--accent1)' }}>{item.name}</span>
                    <span className="font-pixel text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--accent3)', fontSize: '0.45rem' }}>
                      {item.rarity.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-ui text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Type: {item.type.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="font-pixel text-sm" style={{ color: 'var(--accent3)' }}>🪙 {item.price}</span>
                  <button className="retro-btn small" onClick={() => handleBuy(item)}>
                    BUY ITEM
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

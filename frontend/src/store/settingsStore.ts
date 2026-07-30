import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface SettingsState extends Settings {
  setTheme: (t: Settings['theme']) => void;
  setScanlines: (v: boolean) => void;
  setVignette: (v: boolean) => void;
  setPixelFont: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setTheme: (theme) => set({ theme }),
      setScanlines: (scanlines) => set({ scanlines }),
      setVignette: (vignette) => set({ vignette }),
      setPixelFont: (pixelFont) => set({ pixelFont }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
    }),
    { name: 'retrohub_v2_settings' }
  )
);

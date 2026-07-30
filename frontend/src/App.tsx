import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { ScanlineOverlay } from './components/ScanlineOverlay';
import { BootPage } from './pages/BootPage';
import { PlayerPage } from './pages/PlayerPage';
import { DashboardPage } from './pages/DashboardPage';
import { GamePage } from './pages/GamePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { StorePage } from './pages/StorePage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ScanlineOverlay />
        <Routes>
          <Route path="/"           element={<BootPage />} />
          <Route path="/player"     element={<PlayerPage />} />
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/game/:id"   element={<GamePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
          <Route path="/profile"    element={<ProfilePage />} />
          <Route path="/store"      element={<StorePage />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

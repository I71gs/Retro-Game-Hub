export interface UserProfile {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  avatar: string;
  theme: string;
  createdAt: string;
}

export interface AchievementItem {
  id: string;
  key: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardCoins: number;
  icon: string;
}

export interface UserAchievementItem {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  achievement: AchievementItem;
}

export interface StoreCatalogItem {
  id: string;
  name: string;
  price: number;
  type: 'avatar' | 'theme' | 'sfx';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AnalyticsSummary {
  user: UserProfile;
  totalGames: number;
  totalWins: number;
  winRate: number;
  bestStreak: number;
  avgMatchTimeSeconds: number;
  statsPerGame: {
    game: string;
    wins: number;
    losses: number;
    draws: number;
    longestStreak: number;
  }[];
}

import type { UserProfile, AchievementItem, UserAchievementItem, StoreCatalogItem, AnalyticsSummary } from '../types/api';

const API_BASE = 'http://localhost:3000';

class ApiService {
  private token: string | null = null;

  setToken(t: string | null) {
    this.token = t;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(errorData.message || 'API request failed');
    }

    return res.json();
  }

  // Auth
  async register(username: string, email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Matches & Progression
  async recordMatch(payload: {
    userId: string;
    game: string;
    won: boolean;
    duration?: number;
    moves?: any;
    coinsAwarded?: number;
  }): Promise<{
    user: UserProfile;
    matchId: string;
    xpGained: number;
    levelUp: boolean;
    unlockedAchievements: string[];
  }> {
    return this.request('/games/match', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Achievements
  async getAchievements(): Promise<AchievementItem[]> {
    return this.request('/achievements');
  }

  async getUserAchievements(userId: string): Promise<UserAchievementItem[]> {
    return this.request(`/achievements/user/${userId}`);
  }

  // Store
  async getStoreCatalog(): Promise<StoreCatalogItem[]> {
    return this.request('/store/catalog');
  }

  async buyItem(userId: string, itemId: string) {
    return this.request('/store/buy', {
      method: 'POST',
      body: JSON.stringify({ userId, itemId }),
    });
  }

  // Analytics
  async getUserAnalytics(userId: string): Promise<AnalyticsSummary> {
    return this.request(`/analytics/user/${userId}`);
  }
}

export const api = new ApiService();

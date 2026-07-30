import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private achievementsService: AchievementsService,
  ) {}

  async recordMatch(body: {
    userId: string;
    game: string;
    won: boolean;
    duration?: number;
    moves?: any;
    coinsAwarded?: number;
  }) {
    const { userId, game, won, duration = 0, moves = null, coinsAwarded = 0 } = body;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Fetch or create game stats for user
    let stats = await this.prisma.statistics.findUnique({
      where: { userId_game: { userId, game } },
    });

    if (!stats) {
      stats = await this.prisma.statistics.create({
        data: { userId, game },
      });
    }

    // Calculate progression rewards: Win = +100 XP, Loss/Draw = +20 XP
    const xpGained = won ? 100 : 20;
    const newXp = user.xp + xpGained;
    const newLevel = Math.floor(newXp / 500) + 1; // 500 XP per level

    const updatedWins = won ? stats.wins + 1 : stats.wins;
    const updatedLosses = won ? stats.losses : stats.losses + 1;
    const updatedStreak = won ? stats.longestStreak + 1 : 0;

    // Update statistics
    await this.prisma.statistics.update({
      where: { id: stats.id },
      data: {
        wins: updatedWins,
        losses: updatedLosses,
        longestStreak: Math.max(stats.longestStreak, updatedStreak),
      },
    });

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        level: newLevel,
        coins: { increment: coinsAwarded },
      },
    });

    // Save Match History
    const match = await this.prisma.matchHistory.create({
      data: {
        player1Id: userId,
        game,
        winnerId: won ? userId : null,
        duration,
        moves,
      },
    });

    // Evaluate Achievements
    const unlockedAchievements = await this.achievementsService.evaluateGameResult(
      userId,
      game,
      won,
      updatedStreak,
      updatedWins,
    );

    const { passwordHash, ...safeUser } = updatedUser;

    return {
      user: safeUser,
      matchId: match.id,
      xpGained,
      levelUp: newLevel > user.level,
      unlockedAchievements,
    };
  }

  async getLeaderboard(game?: string) {
    if (game && game !== 'all') {
      return this.prisma.statistics.findMany({
        where: { game },
        orderBy: { wins: 'desc' },
        take: 20,
        include: { user: { select: { username: true, avatar: true, level: true, coins: true } } },
      });
    }

    return this.prisma.user.findMany({
      orderBy: { coins: 'desc' },
      take: 20,
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        xp: true,
        coins: true,
      },
    });
  }

  async getUserHistory(userId: string) {
    return this.prisma.matchHistory.findMany({
      where: { player1Id: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

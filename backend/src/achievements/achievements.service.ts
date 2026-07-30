import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async getAllAchievements() {
    return this.prisma.achievement.findMany();
  }

  async getUserAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
  }

  async evaluateGameResult(userId: string, game: string, won: boolean, currentStreak: number, totalWins: number) {
    const achievements = await this.prisma.achievement.findMany();
    const unlocked: string[] = [];

    const existing = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(existing.map((e) => e.achievementId));

    for (const ach of achievements) {
      if (unlockedIds.has(ach.id)) continue;

      let conditionMet = false;
      if (ach.key === 'FIRST_WIN' && won) conditionMet = true;
      if (ach.key === 'STREAK_5' && currentStreak >= 5) conditionMet = true;
      if (ach.key === 'WINS_10' && totalWins >= 10) conditionMet = true;
      if (ach.key === `${game.toUpperCase()}_MASTER` && won) conditionMet = true;

      if (conditionMet) {
        await this.prisma.userAchievement.create({
          data: { userId, achievementId: ach.id },
        });

        // Award rewards
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: ach.rewardXp },
            coins: { increment: ach.rewardCoins },
          },
        });

        unlocked.push(ach.title);
      }
    }

    return unlocked;
  }
}

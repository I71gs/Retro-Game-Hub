import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get player statistics summary for the analytics dashboard' })
  async getUserAnalytics(@Param('userId') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        level: true,
        xp: true,
        coins: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const stats = await this.prisma.statistics.findMany({
      where: { userId },
    });

    const matches = await this.prisma.matchHistory.findMany({
      where: { player1Id: userId },
    });

    const totalGames = stats.reduce((acc, curr) => acc + curr.wins + curr.losses + curr.draws, 0);
    const totalWins = stats.reduce((acc, curr) => acc + curr.wins, 0);
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    const bestStreak = Math.max(0, ...stats.map((s) => s.longestStreak));
    const avgMatchTime =
      matches.length > 0
        ? Math.round(matches.reduce((acc, m) => acc + m.duration, 0) / matches.length)
        : 0;

    return {
      user,
      totalGames,
      totalWins,
      winRate,
      bestStreak,
      avgMatchTimeSeconds: avgMatchTime,
      statsPerGame: stats,
    };
  }
}

import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post('match')
  @ApiOperation({ summary: 'Record completed match result, process XP & Achievements' })
  async recordMatch(
    @Body()
    body: {
      userId: string;
      game: string;
      won: boolean;
      duration?: number;
      moves?: any;
      coinsAwarded?: number;
    },
  ) {
    return this.gamesService.recordMatch(body);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get global or game-specific leaderboard' })
  async getLeaderboard(@Query('game') game?: string) {
    return this.gamesService.getLeaderboard(game);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get match history for a user' })
  async getUserHistory(@Param('userId') userId: string) {
    return this.gamesService.getUserHistory(userId);
  }
}

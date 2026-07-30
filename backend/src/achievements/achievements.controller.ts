import { Controller, Get, Param } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available achievements' })
  async getAll() {
    return this.achievementsService.getAllAchievements();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get unlocked achievements for a specific user' })
  async getUserAchievements(@Param('userId') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }
}

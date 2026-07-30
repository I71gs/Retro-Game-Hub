import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { GamesModule } from './games/games.module';
import { AchievementsModule } from './achievements/achievements.module';
import { StoreModule } from './store/store.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    GamesModule,
    AchievementsModule,
    StoreModule,
    AnalyticsModule,
  ],
})
export class AppModule {}

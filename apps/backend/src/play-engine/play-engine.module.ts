import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PlayEngineController } from './play-engine.controller';
import { PlayEngineService } from './play-engine.service';
import { AiModule } from '../ai/ai.module';
import { GmailModule } from '../gmail/gmail.module';

@Module({
  imports: [ScheduleModule.forRoot(), AiModule, GmailModule],
  controllers: [PlayEngineController],
  providers: [PlayEngineService],
  exports: [PlayEngineService],
})
export class PlayEngineModule {}

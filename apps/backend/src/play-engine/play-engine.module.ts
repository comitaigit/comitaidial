import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PlayEngineService } from './play-engine.service';
import { AiModule } from '../ai/ai.module';
import { GmailModule } from '../gmail/gmail.module';

// No controller: the only entry point right now is
// PlayEngineService.recordEvent(), called by other feature modules
// (LinkedIn extension — a later build-order item) once it exists, not by
// an external HTTP caller.
@Module({
  imports: [ScheduleModule.forRoot(), AiModule, GmailModule],
  providers: [PlayEngineService],
  exports: [PlayEngineService],
})
export class PlayEngineModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PlayEngineService } from './play-engine.service';

// No controller: the only entry point right now is
// PlayEngineService.recordEvent(), called by other feature modules
// (AI Email, LinkedIn extension — later build-order items) once they
// exist, not by an external HTTP caller.
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PlayEngineService],
  exports: [PlayEngineService],
})
export class PlayEngineModule {}

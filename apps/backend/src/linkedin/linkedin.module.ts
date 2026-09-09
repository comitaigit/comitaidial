import { Module } from '@nestjs/common';
import { LinkedInController } from './linkedin.controller';
import { LinkedInService } from './linkedin.service';
import { PlayEngineModule } from '../play-engine/play-engine.module';

@Module({
  imports: [PlayEngineModule],
  controllers: [LinkedInController],
  providers: [LinkedInService],
})
export class LinkedInModule {}

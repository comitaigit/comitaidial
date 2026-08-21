import { Controller, Get } from '@nestjs/common';
import { OverviewService } from './overview.service';

@Controller('overview')
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  @Get('summary')
  getSummary() {
    return this.overview.getSummary();
  }

  // Separate from /summary since it calls an LLM and can take a few
  // seconds — the KPIs/work queue shouldn't block on it.
  @Get('insight')
  getInsight() {
    return this.overview.getInsight();
  }
}

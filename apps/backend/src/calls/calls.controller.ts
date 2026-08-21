import { Body, Controller, Post } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CreateTestCallDto } from './dto/create-test-call.dto';

@Controller('calls')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Post('test')
  async test(@Body() dto: CreateTestCallDto) {
    return this.calls.placeTestCall(dto.to);
  }
}

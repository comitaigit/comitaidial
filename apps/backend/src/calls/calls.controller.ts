import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CallsService } from './calls.service';
import { CreateTestCallDto } from './dto/create-test-call.dto';
import { UpdateCallOutcomeDto } from './dto/update-call-outcome.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('calls')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get()
  findAll(@Query('personId') personId?: string) {
    return this.calls.findAll(personId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calls.findOne(id);
  }

  @Post('test')
  test(@Body() dto: CreateTestCallDto, @CurrentUser() user: AuthenticatedUser) {
    return this.calls.placeTestCall(dto.to, user.userId);
  }

  @Patch(':id')
  updateOutcome(
    @Param('id') id: string,
    @Body() dto: UpdateCallOutcomeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calls.updateOutcome(id, dto, user.userId);
  }
}

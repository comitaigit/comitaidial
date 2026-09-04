import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ImportPeopleDto } from './dto/import-people.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  findAll(
    @Query('accountId') accountId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.people.findAll(user.tenantId, accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.people.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreatePersonDto, @CurrentUser() user: AuthenticatedUser) {
    return this.people.create(dto, user.userId, user.tenantId);
  }

  @Post('import')
  importCsv(
    @Body() dto: ImportPeopleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.people.importFromCsv(
      dto.csv,
      dto.cadenceId,
      user.userId,
      user.tenantId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.people.update(id, dto, user.userId, user.tenantId);
  }
}

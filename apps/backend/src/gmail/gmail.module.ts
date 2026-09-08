import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [GmailController],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}

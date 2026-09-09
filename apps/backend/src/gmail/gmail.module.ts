import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
  imports: [JwtModule.register({}), EncryptionModule],
  controllers: [GmailController],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}

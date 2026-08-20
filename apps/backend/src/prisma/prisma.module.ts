import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global so every feature module can inject PrismaService without each one
 * re-importing PrismaModule — this is the one deliberate exception to
 * "import only what you use" for a connection singleton.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

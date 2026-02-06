import { Module } from '@nestjs/common';
import { BiometricService } from './biometric.service';
import { BiometricController } from './biometric.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth';


@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BiometricController],
  providers: [BiometricService],
  exports: [BiometricService],
})
export class BiometricModule {}
import { Module } from '@nestjs/common';
import { CheckinoutService } from './checkinout.service';
import { CheckinoutController } from './checkinout.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [CheckinoutController],
  providers: [CheckinoutService, PrismaService],
})
export class CheckinoutModule {}
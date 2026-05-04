import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { PrismaService } from '../common/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, PrismaService, ReviewsService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
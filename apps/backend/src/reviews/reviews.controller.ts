import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() data: { reservationId: string; rating: number; comment?: string },
    @Request() req,
  ) {
    return this.reviewsService.create(data.reservationId, req.user.id, data.rating, data.comment);
  }

  @Get('vehicle/:vehicleId')
  async getByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.reviewsService.getByVehicle(vehicleId);
  }

  @Get('reservation/:reservationId')
  async getByReservation(@Param('reservationId') reservationId: string) {
    return this.reviewsService.getByReservation(reservationId);
  }
}
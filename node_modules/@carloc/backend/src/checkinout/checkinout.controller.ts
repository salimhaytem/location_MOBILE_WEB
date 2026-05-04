import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CheckinoutService } from './checkinout.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('checkinout')
@UseGuards(JwtAuthGuard)
export class CheckinoutController {
  constructor(private service: CheckinoutService) {}

  @Get('planning')
  async getDailyPlanning(@Query('date') date?: string) {
    return this.service.getDailyPlanning(date);
  }

  @Post(':reservationId/checkin')
  async checkIn(
    @Param('reservationId') reservationId: string,
    @Body() data: any,
    @Request() req,
  ) {
    return this.service.checkIn(reservationId, req.user.id, data);
  }

  @Post(':reservationId/checkout')
  async checkOut(
    @Param('reservationId') reservationId: string,
    @Body() data: any,
    @Request() req,
  ) {
    return this.service.checkOut(reservationId, req.user.id, data);
  }

  @Post(':reservationId/validate-cash')
  async validateCash(
    @Param('reservationId') reservationId: string,
  ) {
    return this.service.validateCashPayment(reservationId);
  }
}
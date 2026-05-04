import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReservationDto } from './dto/reservations.dto';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.reservationsService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateReservationDto, @Request() req) {
    return this.reservationsService.create(createDto, req.user.id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.reservationsService.updateStatus(id, status);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Request() req) {
    return this.reservationsService.cancel(id, req.user.id, req.user.role);
  }
}
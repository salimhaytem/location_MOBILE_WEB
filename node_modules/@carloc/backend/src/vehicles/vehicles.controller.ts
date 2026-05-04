import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicles.dto';
import { ReviewsService } from '../reviews/reviews.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(
    private vehiclesService: VehiclesService,
    private reviewsService: ReviewsService,
  ) {}

  @Get()
  async findAll(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get('categories')
  async getCategories() {
    return this.vehiclesService.getCategories();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/reviews')
  async getVehicleReviews(@Param('id') id: string) {
    return this.reviewsService.getByVehicle(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDto: CreateVehicleDto, @Request() req) {
    return this.vehiclesService.create(createDto, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateVehicleDto, @Request() req) {
    return this.vehiclesService.update(id, updateDto, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req) {
    return this.vehiclesService.updateStatus(id, status, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.remove(id, req.user.role);
  }
}
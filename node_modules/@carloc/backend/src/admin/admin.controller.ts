import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      return { message: 'Access denied' };
    }
    return this.adminService.getDashboard();
  }

  @Get('today-reservations')
  async getTodayReservations(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      return { message: 'Access denied' };
    }
    return this.adminService.getTodayReservations();
  }

  @Get('revenue-chart')
  async getRevenueChart(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      return { message: 'Access denied' };
    }
    return this.adminService.getRevenueChart();
  }

  @Get('cash-journal')
  async getCashJournal(@Request() req, @Query('date') date?: string) {
    if (req.user.role !== 'ADMIN') {
      return { message: 'Access denied' };
    }
    return this.adminService.getCashJournal(date);
  }

  @Get('reports/financial')
  async getFinancialReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminService.getFinancialReport(startDate, endDate);
  }

  @Get('reports/export')
  async exportData(
    @Query('format') format: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.exportData(format || 'json', from, to);
  }

  @Get('reviews')
  async getReviews(@Request() req, @Query('status') status?: string) {
    if (req.user.role !== 'ADMIN') {
      return { message: 'Access denied' };
    }
    return this.adminService.getReviews(status);
  }

  @Patch('reviews/:id')
  async moderateReview(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { action: 'publish' | 'reject' },
  ) {
    if (req.user.role !== 'ADMIN') {
      return { message: 'Access denied' };
    }
    return this.adminService.moderateReview(id, body.action);
  }

  @Get('incidents')
  async getIncidents(@Request() req, @Query('status') status?: string) {
    if (req.user.role !== 'ADMIN') {
      return { message: 'Access denied' };
    }
    return this.adminService.getIncidents(status);
  }

  @Patch('incidents/:id')
  async updateIncident(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status?: string; adminNote?: string },
  ) {
    if (req.user.role !== 'ADMIN') {
      return { message: 'Access denied' };
    }
    return this.adminService.updateIncident(id, body.status, body.adminNote);
  }
}
import { Controller, Get, Patch, Body, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/users.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Request() req, @Body() updateDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@Query('role') role?: string) {
    return this.usersService.getAllUsers(role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('push-token')
  async updatePushToken(@Request() req, @Body() body: { pushToken: string }) {
    return this.usersService.updatePushToken(req.user.id, body.pushToken);
  }
}
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('test')
  async testNotification(
    @Body() body: { email: string; event: string; data: any },
  ) {
    await this.notificationsService.sendEmail(body.email, body.event as any, body.data);
    return { message: 'Notification sent' };
  }
}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ReservationsModule } from './reservations/reservations.module';
import { CheckinoutModule } from './checkinout/checkinout.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    VehiclesModule,
    ReservationsModule,
    CheckinoutModule,
    AdminModule,
    ReviewsModule,
    NotificationsModule,
    PaymentsModule,
    InvoicesModule,
  ],
})
export class AppModule {}
import { Controller, Post, Body, Headers, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Body() rawBody: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleStripeWebhook(
      JSON.stringify(rawBody),
      signature,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createPaymentIntent(
    @Body() body: { reservationId: string; amount: number },
  ) {
    return this.paymentsService.createPaymentIntent(body.reservationId, body.amount);
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface StripeEvent {
  type: string;
  data: {
    object: {
      id: string;
      metadata: {
        reservationId?: string;
      };
      amount: number;
      status: string;
    };
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripeSecretKey: string;
  private readonly stripeWebhookSecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    this.stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY') || '';
    this.stripeWebhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || '';
  }

  async handleStripeWebhook(payload: string, signature: string): Promise<{ received: boolean }> {
    this.logger.log('Received Stripe webhook');

    if (!this.stripeSecretKey) {
      this.logger.warn('Stripe not configured');
      return { received: true };
    }

    try {
      const stripe = require('stripe')(this.stripeSecretKey);
      const event = stripe.webhooks.constructEvent(payload, signature, this.stripeWebhookSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      this.logger.error(`Webhook Error: ${err.message}`);
      throw err;
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const reservationId = paymentIntent.metadata?.reservationId;
    if (!reservationId) {
      this.logger.warn('Payment succeeded but no reservationId in metadata');
      return;
    }

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CONFIRMED',
        depositPaid: true,
        stripePaymentId: paymentIntent.id,
      },
    });

    await this.notificationsService.sendCashConfirmed(reservationId);
    this.logger.log(`Reservation ${reservationId} confirmed via Stripe payment`);
  }

  private async handlePaymentFailure(paymentIntent: any) {
    const reservationId = paymentIntent.metadata?.reservationId;
    if (!reservationId) return;

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.vehicle.update({
      where: { id: (await this.prisma.reservation.findUnique({ where: { id: reservationId } }))?.vehicleId },
      data: { status: 'AVAILABLE' },
    });

    this.logger.log(`Reservation ${reservationId} cancelled due to payment failure`);
  }

  async createPaymentIntent(reservationId: string, amount: number) {
    if (!this.stripeSecretKey) {
      throw new Error('Stripe not configured');
    }

    const stripe = require('stripe')(this.stripeSecretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'mad',
      metadata: { reservationId },
    });

    return { clientSecret: paymentIntent.client_secret };
  }
}
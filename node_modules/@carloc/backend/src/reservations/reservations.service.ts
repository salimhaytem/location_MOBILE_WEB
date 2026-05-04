import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { CreateReservationDto, UpdateReservationDto } from './dto/reservations.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

const OPTIONS_PRICES = { insurance: 150, gps: 80, babySeat: 60 };

function getCancellationConfig(configService: ConfigService) {
  return {
    FREE_HOURS: configService.get<number>('CANCEL_FREE_HOURS') || 48,
    PARTIAL_HOURS: configService.get<number>('CANCEL_PARTIAL_HOURS') || 24,
    PARTIAL_PENALTY: configService.get<number>('CANCEL_PARTIAL_PENALTY') || 0.5,
  };
}

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoCancelExpiredReservations() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const expiredReservations = await this.prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        paymentMethod: 'CASH',
        createdAt: { lt: thirtyMinutesAgo },
      },
    });

    for (const reservation of expiredReservations) {
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'CANCELLED' },
      });
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: 'AVAILABLE' },
      });
      console.log(`Auto-cancelled reservation ${reservation.id} (expired CASH)`);
    }
  }

  async checkVehicleAvailability(vehicleId: string, pickupDate: string, returnDate: string, excludeId?: string): Promise<boolean> {
    const conflict = await this.prisma.reservation.findFirst({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        vehicleId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        OR: [
          { pickupDate: { lte: returnDate }, returnDate: { gte: pickupDate } },
        ],
      },
    });
    return !conflict;
  }

  private calculatePenalty(reservation: any): { penalty: number; rule: string; message: string } {
    const config = getCancellationConfig(this.configService);
    const now = new Date();
    const pickup = new Date(reservation.pickupDate);
    const hoursUntilPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilPickup > config.FREE_HOURS) {
      return {
        penalty: 0,
        rule: 'REMBOURSEMENT_TOTAL',
        message: `Annulation plus de ${config.FREE_HOURS}h avant le départ - aucun frais`,
      };
    } else if (hoursUntilPickup >= config.PARTIAL_HOURS) {
      const penaltyAmount = reservation.totalPrice * config.PARTIAL_PENALTY;
      return {
        penalty: penaltyAmount,
        rule: 'REMBOURSEMENT_PARTIEL',
        message: `Annulation entre ${config.PARTIAL_HOURS}h et ${config.FREE_HOURS}h - pénalité de ${penaltyAmount} MAD (50%)`,
      };
    } else {
      return {
        penalty: reservation.totalPrice,
        rule: 'AUCUN_REMBOURSEMENT',
        message: `Annulation moins de ${config.PARTIAL_HOURS}h avant le départ - aucun remboursement`,
      };
    }
  }

  private async calculatePrice(vehicle: any, createDto: CreateReservationDto): Promise<number> {
    const days = Math.ceil(
      (new Date(createDto.returnDate).getTime() - new Date(createDto.pickupDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let totalPrice = vehicle.pricePerDay * days;
    if (createDto.insurance) totalPrice += OPTIONS_PRICES.insurance * days;
    if (createDto.gps) totalPrice += OPTIONS_PRICES.gps * days;
    if (createDto.babySeat) totalPrice += OPTIONS_PRICES.babySeat * days;

    return totalPrice;
  }

  async findAll(userId: string, role: string) {
    if (role === 'CLIENT') {
      return this.prisma.reservation.findMany({
        where: { userId },
        include: { vehicle: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.reservation.findMany({
      include: {
        vehicle: { include: { category: true } },
        user: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        vehicle: { include: { category: true } },
        user: { include: { profile: true } },
        checkin: true,
        checkout: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async create(createDto: CreateReservationDto, userId: string) {
    const isAvailable = await this.checkVehicleAvailability(
      createDto.vehicleId,
      createDto.pickupDate,
      createDto.returnDate
    );

    if (!isAvailable) {
      throw new BadRequestException('Vehicle is not available for selected dates');
    }

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: createDto.vehicleId },
      });

      if (!vehicle || vehicle.status !== 'AVAILABLE') {
        throw new BadRequestException('Vehicle not available');
      }

      const totalPrice = await this.calculatePrice(vehicle, createDto);

      const reservation = await tx.reservation.create({
        data: {
          userId,
          vehicleId: createDto.vehicleId,
          pickupDate: createDto.pickupDate,
          returnDate: createDto.returnDate,
          pickupLocation: createDto.pickupLocation,
          returnLocation: createDto.returnLocation,
          totalPrice,
          depositAmount: vehicle.deposit,
          insurance: createDto.insurance || false,
          gps: createDto.gps || false,
          babySeat: createDto.babySeat || false,
          notes: createDto.notes,
          paymentMethod: createDto.paymentMethod || 'CASH',
          status: 'PENDING',
        },
      });

      await tx.vehicle.update({
        where: { id: createDto.vehicleId },
        data: { status: 'RENTED' },
      });

      return reservation;
    });
  }

  async updateStatus(id: string, status: string) {
    const reservation = await this.prisma.reservation.update({
      where: { id },
      data: { status: status as any },
    });

    if (status === 'CANCELLED') {
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    return reservation;
  }

  async cancel(id: string, userId: string, role: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (role === 'CLIENT' && reservation.userId !== userId) {
      throw new BadRequestException('Not authorized to cancel this reservation');
    }

    const penaltyInfo = this.calculatePenalty(reservation);
    const refundAmount = reservation.totalPrice - penaltyInfo.penalty;

    let stripeRefundResult = null;
    if (reservation.stripePaymentId && reservation.depositPaid && refundAmount > 0) {
      try {
        const stripe = require('stripe')(this.configService.get('STRIPE_SECRET_KEY'));
        
        if (penaltyInfo.penalty === 0) {
          await stripe.refunds.create({ payment_intent: reservation.stripePaymentId });
          stripeRefundResult = { status: 'REFUNDED_FULL', amount: refundAmount };
        } else if (refundAmount > 0) {
          await stripe.refunds.create({
            payment_intent: reservation.stripePaymentId,
            amount: Math.round(refundAmount * 100),
          });
          stripeRefundResult = { status: 'REFUNDED_PARTIAL', amount: refundAmount };
        }
      } catch (error) {
        console.error('Stripe refund error:', error.message);
        stripeRefundResult = { status: 'REFUND_FAILED', error: error.message };
      }
    }

    await this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reservation.notes
          ? `${reservation.notes}\n[Annulation] ${penaltyInfo.rule} - ${penaltyInfo.message}`
          : `[Annulation] ${penaltyInfo.rule} - ${penaltyInfo.message}`,
      },
    });

    await this.prisma.vehicle.update({
      where: { id: reservation.vehicleId },
      data: { status: 'AVAILABLE' },
    });

    return {
      success: true,
      message: penaltyInfo.message,
      cancellationRule: penaltyInfo.rule,
      penaltyAmount: penaltyInfo.penalty,
      refundAmount,
      totalPaid: reservation.totalPrice,
      stripeRefund: stripeRefundResult,
    };
  }
}
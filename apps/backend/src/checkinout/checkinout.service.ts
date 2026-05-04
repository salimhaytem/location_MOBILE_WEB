import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CheckinoutService {
  constructor(private prisma: PrismaService) {}

  async getDailyPlanning(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        OR: [
          { pickupDate: { gte: targetDate, lte: endOfDay } },
          { returnDate: { gte: targetDate, lte: endOfDay } },
        ],
        status: { in: ['CONFIRMED', 'ACTIVE'] },
      },
      include: {
        vehicle: true,
        user: { include: { profile: true } },
      },
    });

    const departures = reservations
      .filter((r) => new Date(r.pickupDate) >= targetDate && new Date(r.pickupDate) <= endOfDay)
      .map((r) => ({
        ...r,
        paymentStatus: r.depositPaid ? 'PAID' : 'PENDING',
      }));

    const returns = reservations
      .filter((r) => new Date(r.returnDate) >= targetDate && new Date(r.returnDate) <= endOfDay)
      .map((r) => ({
        ...r,
        paymentStatus: r.depositPaid ? 'PAID' : 'PENDING',
      }));

    return { departures, returns };
  }

  async checkIn(reservationId: string, agentId: string, data: any) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { vehicle: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const checkin = await this.prisma.checkIn.create({
      data: {
        reservationId,
        agentId,
        pickupDateTime: new Date(),
        vehicleCondition: data.vehicleCondition,
        kmAtPickup: data.kmAtPickup,
        fuelLevelPickup: data.fuelLevelPickup,
        notes: data.notes,
        signature: data.signature,
      },
    });

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.vehicle.update({
      where: { id: reservation.vehicleId },
      data: { mileage: data.kmAtPickup },
    });

    return checkin;
  }

  async checkOut(reservationId: string, agentId: string, data: any) {
    const KM_INCLUDED_PER_DAY = 200;
    const PRICE_PER_EXTRA_KM = 2;

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { vehicle: true, checkin: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const days = Math.ceil(
      (new Date(reservation.returnDate).getTime() - new Date(reservation.pickupDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const kmAtReturn = data.kmAtReturn;
    const kmAtPickup = reservation.checkin?.kmAtPickup || 0;
    const kmDriven = kmAtReturn - kmAtPickup;
    const kmIncluded = KM_INCLUDED_PER_DAY * days;
    const extraKm = Math.max(0, kmDriven - kmIncluded);
    const additionalCharges = extraKm * PRICE_PER_EXTRA_KM;

    const checkout = await this.prisma.checkOut.create({
      data: {
        reservationId,
        agentId,
        returnDateTime: new Date(),
        vehicleCondition: data.vehicleCondition,
        kmAtReturn,
        fuelReturnLevel: data.fuelReturnLevel,
        additionalCharges,
        notes: data.notes,
        signature: data.signature,
      },
    });

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'COMPLETED' },
    });

    await this.prisma.vehicle.update({
      where: { id: reservation.vehicleId },
      data: { status: 'AVAILABLE', mileage: kmAtReturn },
    });

    return { checkout, extraKm, additionalCharges, kmIncluded, kmDriven };
  }

  async validateCashPayment(reservationId: string) {
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { depositPaid: true },
    });
  }
}
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(reservationId: string, userId: string, rating: number, comment?: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.userId !== userId) {
      throw new BadRequestException('Invalid reservation');
    }

    if (reservation.status !== 'COMPLETED') {
      throw new BadRequestException('Can only review completed reservations');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: { reservationId, userId },
    });

    if (existingReview) {
      throw new BadRequestException('Already reviewed this reservation');
    }

    return this.prisma.review.create({
      data: { reservationId, userId, rating, comment },
    });
  }

  async getByVehicle(vehicleId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { vehicleId, status: 'COMPLETED' },
      include: { reviews: { where: { isPublished: true } } },
    });

    const reviews = reservations.flatMap((r) => r.reviews);
    const avgRating = reviews.length
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

    return { reviews, averageRating: avgRating.toFixed(1), count: reviews.length };
  }

  async getByReservation(reservationId: string) {
    return this.prisma.review.findMany({ where: { reservationId } });
  }
}
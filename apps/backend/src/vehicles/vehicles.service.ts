import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: VehicleQueryDto) {
    const { category, transmission, minPrice, maxPrice, status, city } = query;

    const where: any = {};

    if (category) where.categoryId = category;
    if (transmission) where.transmission = transmission;
    if (status) where.status = status;
    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) where.pricePerDay.gte = minPrice;
      if (maxPrice) where.pricePerDay.lte = maxPrice;
    }

    return this.prisma.vehicle.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async create(createDto: CreateVehicleDto, userRole: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create vehicles');
    }

    return this.prisma.vehicle.create({
      data: {
        ...createDto,
        images: createDto.images || [],
        features: createDto.features || [],
      },
    });
  }

  async update(id: string, updateDto: UpdateVehicleDto, userRole: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update vehicles');
    }

    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: updateDto,
    });

    return vehicle;
  }

  async updateStatus(id: string, status: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'PERSONNEL') {
      throw new ForbiddenException('Not authorized to update vehicle status');
    }

    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: { status: status as any },
    });

    return vehicle;
  }

  async remove(id: string, userRole: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete vehicles');
    }

    await this.prisma.vehicle.delete({ where: { id } });
    return { message: 'Vehicle deleted successfully' };
  }

  async getCategories() {
    return this.prisma.category.findMany();
  }
}
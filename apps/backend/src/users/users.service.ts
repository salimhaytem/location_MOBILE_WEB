import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateProfileDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        phone: updateDto.phone,
      },
    });

    if (updateDto.address || updateDto.city) {
      await this.prisma.profile.update({
        where: { userId },
        data: {
          address: updateDto.address,
          city: updateDto.city,
          country: updateDto.country,
          postalCode: updateDto.postalCode,
          drivingLicenseNumber: updateDto.drivingLicenseNumber,
          drivingLicenseExpiry: updateDto.drivingLicenseExpiry,
          idCardNumber: updateDto.idCardNumber,
          idCardExpiry: updateDto.idCardExpiry,
        },
      });
    }

    return user;
  }

  async getAllUsers(role?: string) {
    const where = role ? { role: role as any } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async createUser(data: any) {
    return this.prisma.user.create({
      data: {
        ...data,
        profile: { create: {} },
      },
    });
  }

  async updatePushToken(userId: string, pushToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });
    return { success: true };
  }
}
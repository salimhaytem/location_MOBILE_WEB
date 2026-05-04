import { IsString, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';

export class VehicleQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['AUTO', 'MANUAL'])
  transmission?: 'AUTO' | 'MANUAL';

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsEnum(['AVAILABLE', 'MAINTENANCE', 'RENTED'])
  status?: 'AVAILABLE' | 'MAINTENANCE' | 'RENTED';

  @IsOptional()
  @IsString()
  city?: string;
}

export class CreateVehicleDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsString()
  categoryId: string;

  @IsString()
  registrationNumber: string;

  @IsNumber()
  year: number;

  @IsString()
  color: string;

  @IsEnum(['AUTO', 'MANUAL'])
  transmission: 'AUTO' | 'MANUAL';

  @IsEnum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'])
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';

  @IsNumber()
  doors: number;

  @IsNumber()
  seats: number;

  @IsNumber()
  luggage: number;

  @IsNumber()
  pricePerDay: number;

  @IsOptional()
  @IsNumber()
  pricePerKm?: number;

  @IsNumber()
  deposit: number;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  features?: string[];
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  pricePerDay?: number;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  features?: string[];
}
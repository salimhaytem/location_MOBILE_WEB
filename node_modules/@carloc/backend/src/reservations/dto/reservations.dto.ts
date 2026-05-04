import { IsString, IsDateString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  vehicleId: string;

  @IsDateString()
  pickupDate: string;

  @IsDateString()
  returnDate: string;

  @IsString()
  pickupLocation: string;

  @IsString()
  returnLocation: string;

  @IsOptional()
  @IsBoolean()
  insurance?: boolean;

  @IsOptional()
  @IsBoolean()
  gps?: boolean;

  @IsOptional()
  @IsBoolean()
  babySeat?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['CARD', 'CASH', 'TRANSFER'])
  paymentMethod?: 'CARD' | 'CASH' | 'TRANSFER';
}

export class UpdateReservationDto {
  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  returnLocation?: string;
}
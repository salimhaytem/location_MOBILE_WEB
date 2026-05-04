import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  drivingLicenseNumber?: string;

  @IsOptional()
  @IsDateString()
  drivingLicenseExpiry?: string;

  @IsOptional()
  @IsString()
  idCardNumber?: string;

  @IsOptional()
  @IsDateString()
  idCardExpiry?: string;
}
export enum Role {
  CLIENT = 'CLIENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export const ROLE_STAFF = 'STAFF';
export const ROLE_ADMIN = 'ADMIN';
export const ROLE_CLIENT = 'CLIENT';

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
  RENTED = 'RENTED',
}

export enum Transmission {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: Category;
  registrationNumber: string;
  year: number;
  color: string;
  transmission: Transmission;
  fuelType: FuelType;
  doors: number;
  seats: number;
  luggage: number;
  pricePerDay: number;
  pricePerKm: number;
  deposit: number;
  mileage: number;
  status: VehicleStatus;
  images: string[];
  description?: string;
  features: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  basePricePerDay: number;
}

export interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  vehicle: Vehicle;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
  status: ReservationStatus;
  totalPrice: number;
  depositAmount: number;
  depositPaid: boolean;
  insurance: boolean;
  gps: boolean;
  babySeat: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER';

export interface PendingReservation {
  vehicleId: string;
  vehicleName: string;
  vehicleImage?: string;
  pricePerDay: number;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
  duration: number;
  insurance: boolean;
  gps: boolean;
  babySeat: boolean;
  paymentMethod?: PaymentMethod;
}
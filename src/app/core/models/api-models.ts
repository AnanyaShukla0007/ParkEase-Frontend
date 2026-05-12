// =============================================================
// ParkEase — Backend-mirrored types
// These map 1:1 to the ASP.NET Core DTOs exposed via the YARP
// gateway at /api/v1. Enum numeric values match the .NET enums.
// =============================================================

// ------- Auth -------
export type UserRole = 'DRIVER' | 'MANAGER' | 'ADMIN';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  vehiclePlate?: string | null;
  profilePicUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
  vehiclePlate?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ------- Parking Lot -------
export interface ParkingLot {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  availableSpots: number;
  isActive: boolean;
  isApproved: boolean;
  isOpen: boolean;
  managerId: number;
  openTime: string;   // TimeSpan serializes as "HH:mm:ss"
  closeTime: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface NearbyParkingLot extends ParkingLot {
  distanceKm: number;
  estimatedMinutes: number;
}

export interface CreateParkingLotRequest {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  openTime: string;  // "HH:mm:ss"
  closeTime: string;
  imageUrl?: string | null;
}

// ------- Spot -------
export enum SpotType { Compact = 1, Standard = 2, Large = 3, Motorbike = 4, EV = 5 }
export enum SpotStatus { Available = 1, Reserved = 2, Occupied = 3 }
export enum VehicleTypeEnum { TwoWheeler = 1, FourWheeler = 2, Heavy = 3 }

export const SpotTypeLabel: Record<SpotType, string> = {
  [SpotType.Compact]: 'Compact',
  [SpotType.Standard]: 'Standard',
  [SpotType.Large]: 'Large',
  [SpotType.Motorbike]: 'Motorbike',
  [SpotType.EV]: 'EV'
};

export const SpotStatusLabel: Record<SpotStatus, string> = {
  [SpotStatus.Available]: 'Available',
  [SpotStatus.Reserved]: 'Reserved',
  [SpotStatus.Occupied]: 'Occupied'
};

export const VehicleTypeLabel: Record<VehicleTypeEnum, string> = {
  [VehicleTypeEnum.TwoWheeler]: '2-Wheeler',
  [VehicleTypeEnum.FourWheeler]: '4-Wheeler',
  [VehicleTypeEnum.Heavy]: 'Heavy'
};

export interface ParkingSpot {
  spotId: number;
  lotId: number;
  spotNumber: string;
  floor: number;
  spotType: SpotType;
  vehicleType: VehicleTypeEnum;
  status: SpotStatus;
  isHandicapped: boolean;
  isEVCharging: boolean;
  pricePerHour: number;
}

export interface CreateSpotRequest {
  lotId: number;
  spotNumber: string;
  floor: number;
  spotType: SpotType;
  vehicleType: VehicleTypeEnum;
  isHandicapped: boolean;
  isEVCharging: boolean;
  pricePerHour: number;
}

export interface BulkCreateSpotRequest {
  lotId: number;
  count: number;
  startNumber: number;
  floor: number;
  spotType: SpotType;
  vehicleType: VehicleTypeEnum;
  isHandicapped: boolean;
  isEVCharging: boolean;
  pricePerHour: number;
}

// ------- Vehicle -------
export interface Vehicle {
  vehicleId: number;
  ownerId: number;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  vehicleType: VehicleTypeEnum;
  isEV: boolean;
  registeredAt: string;
  isActive: boolean;
}

export interface CreateVehicleRequest {
  ownerId: number;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  vehicleType: VehicleTypeEnum;
  isEV: boolean;
  isActive?: boolean;
}

// ------- Booking -------
export enum BookingType { PreBooking = 1, WalkIn = 2 }
export enum BookingStatus {
  Pending = 1,
  Reserved = 2,
  Confirmed = 2,
  Active = 3,
  Completed = 4,
  Cancelled = 5,
  Expired = 6,
  NoShow = 7
}
export enum PaymentState {
  NotRequired = 1,
  Pending = 2,
  Paid = 3,
  Failed = 4,
  Refunded = 5
}

export const BookingStatusLabel: Record<BookingStatus, string> = {
  [BookingStatus.Pending]: 'Pending',
  [BookingStatus.Reserved]: 'Reserved',
  [BookingStatus.Active]: 'Active',
  [BookingStatus.Completed]: 'Completed',
  [BookingStatus.Cancelled]: 'Cancelled',
  [BookingStatus.Expired]: 'Expired',
  [BookingStatus.NoShow]: 'No show'
};

export interface Booking {
  id: number;
  userId: number;
  lotId: number;
  spotId: number;
  vehicleId: number;
  vehiclePlate: string;
  bookingType: BookingType;
  status: BookingStatus;
  paymentState: PaymentState;
  startTimeUtc: string;
  endTimeUtc: string;
  checkInTimeUtc?: string | null;
  checkOutTimeUtc?: string | null;
  estimatedAmount: number;
  finalAmount?: number | null;
  notes?: string;
  createdAt: string;
  createdAtUtc?: string;
}

export interface CheckoutReceipt {
  receiptNumber: string;
  issuedAtUtc: string;
  bookingId: number;
  userId: number;
  lotId: number;
  spotId: number;
  vehicleId: number;
  vehiclePlate: string;
  bookingType: BookingType;
  status: BookingStatus;
  paymentState: PaymentState;
  startTimeUtc: string;
  endTimeUtc: string;
  checkInTimeUtc?: string | null;
  checkOutTimeUtc: string;
  estimatedAmount: number;
  finalAmount: number;
  lateFee?: number;
  billableHours?: number;
}

export interface CreateBookingRequest {
  userId: number;
  lotId: number;
  spotId: number;
  vehicleId: number;
  vehiclePlate: string;
  bookingType: BookingType;
  startTimeUtc: string;
  endTimeUtc: string;
  estimatedAmount: number;
  notes: string;
}

// ------- Payment -------
export enum PaymentMethod {
  Card = 1,
  Upi = 2,
  Wallet = 3,
  NetBanking = 4,
  Cash = 5
}

export enum PaymentStatus {
  Pending = 1,
  Paid = 2,
  Failed = 3,
  Refunded = 4
}

export interface Payment {
  id: number;
  bookingId: number;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string | null;
  providerReference?: string | null;
  notes?: string | null;
  paidAtUtc?: string | null;
  refundedAtUtc?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  mode?: string;
  transactionId?: string;
  paidAt?: string;
  refundedAt?: string;
  description?: string;
}

export interface MockRazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  receipt: string;
  status: string;
  createdAtUtc: string;
}

export interface MockRazorpayOrderResponse {
  sagaId: string;
  payment: Payment;
  order: MockRazorpayOrder;
  sagaSteps: string[];
}

export interface MockRazorpayConfirmRequest {
  paymentId: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  simulateFailure?: boolean;
  failureReason?: string | null;
  notes?: string | null;
}

export interface PaymentSagaResponse {
  sagaId: string;
  status: string;
  payment: Payment;
  providerPaymentId?: string | null;
  providerRefundId?: string | null;
  sagaSteps: string[];
}

// ------- Notification -------
export interface Notification {
  id: number;
  recipientId: number;
  type: string;
  title: string;
  message: string;
  channel: string;
  relatedId?: number;
  relatedType?: string;
  isRead: boolean;
  sentAt: string;
}

// ------- Analytics -------
export interface PlatformSummary {
  totalUsers: number;
  totalLots: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  occupancyRate: number;
}

// ------- Manager applications (admin-approved manager onboarding) -------
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ManagerApplication {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  proposedLotName: string;
  proposedAddress: string;
  proposedCity: string;
  message: string;
  status: ApplicationStatus;
  rejectReason?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  generatedUsername?: string | null;
  generatedUserId?: number | null;
}

export interface ManagerApplicationRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  proposedLotName: string;
  proposedAddress: string;
  proposedCity: string;
  message: string;
}

export interface ApprovalCredentials {
  applicationId: number;
  username: string;
  password: string;
  email: string;
  message: string;
}

// ------- Notification approval (managers draft → admin approves) -------
export interface NotificationDraft extends Notification {
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  authorId: number;
  authorRole: string;
}

// ------- Booking QR (mobile check-in / check-out) -------
export interface BookingQrPayload {
  bookingId: number;
  userId: number;
  spotId: number;
  vehiclePlate: string;
  // base64-encoded HMAC-style signature for offline verification
  signature: string;
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import {
  SpotService,
  BookingService,
  VehicleService,
  PaymentService
} from '../../../core/services/api.services';
import {
  ParkingLot, ParkingSpot, SpotType, SpotStatus, SpotTypeLabel,
  Vehicle, BookingType, Booking, MockRazorpayOrderResponse, PaymentMethod
} from '../../../core/models/api-models';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-lot-detail',
  templateUrl: './lot-detail.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './lot-detail.component.scss']
})
export class LotDetailComponent implements OnInit {
  lot?: ParkingLot;
  spots: ParkingSpot[] = [];
  vehicles: Vehicle[] = [];
  loading = true;
  error = '';

  // Filters
  filterFloor: number | null = null;
  filterType: SpotType | null = null;
  filterEV = false;
  filterHandicap = false;

  // Booking modal
  showBookingModal = false;
  selectedSpot: ParkingSpot | null = null;
  selectedVehicle: Vehicle | null = null;
  bookingType: BookingType = BookingType.PreBooking;
  startTime = '';
  endTime = '';
  bookingLoading = false;
  bookingError = '';
  bookingSuccess = false;
  createdBooking: Booking | null = null;
  paymentOrder: MockRazorpayOrderResponse | null = null;
  paymentLoading = false;
  paymentError = '';
  paymentComplete = false;
  selectedPaymentMode: 'UPI' | 'QR' | 'NETBANKING' | 'CASH' | 'CARD' = 'UPI';

  readonly SpotStatus = SpotStatus;
  readonly SpotType = SpotType;
  readonly BookingType = BookingType;
  readonly PaymentMethod = PaymentMethod;
  readonly typeLabel = SpotTypeLabel;
  readonly onlineModes = [
    { value: 'UPI', label: 'UPI', enabled: true },
    { value: 'QR', label: 'QR scan', enabled: false },
    { value: 'NETBANKING', label: 'Net banking', enabled: false }
  ] as const;
  readonly walkInModes = [
    { value: 'CASH', label: 'Cash', enabled: true },
    { value: 'CARD', label: 'Card', enabled: false },
    { value: 'QR', label: 'QR scan', enabled: false }
  ] as const;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lots$: ParkingLotService,
    private spots$: SpotService,
    private bookings$: BookingService,
    private vehicles$: VehicleService,
    private payments$: PaymentService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const userId = this.auth.currentUser?.id;
    if (!id) { this.router.navigate(['/driver/nearby']); return; }

    forkJoin({
      lot: this.lots$.getById(id).pipe(catchError(() => of(null as any))),
      spots: this.spots$.getByLot(id).pipe(catchError(() => of([] as ParkingSpot[]))),
      vehicles: userId
        ? this.vehicles$.getByOwner(userId).pipe(catchError(() => of([] as Vehicle[])))
        : of([] as Vehicle[])
    }).subscribe(res => {
      this.loading = false;
      if (!res.lot) { this.error = 'Could not load this lot.'; return; }
      this.lot = res.lot;
      this.spots = res.spots || [];
      this.vehicles = res.vehicles || [];
    });

    // Prefill booking times
    const now = new Date();
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    this.startTime = this.toLocalInput(now);
    this.endTime = this.toLocalInput(later);
  }

  private toLocalInput(d: Date): string {
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16);
  }

  /** Group spots by floor */
  get floors(): number[] {
    return [...new Set(this.spots.map(s => s.floor))].sort((a, b) => a - b);
  }

  /** Distinct spot types in this lot */
  get availableTypes(): SpotType[] {
    return [...new Set(this.spots.map(s => s.spotType))].sort();
  }

  spotsFor(floor: number): ParkingSpot[] {
    return this.filtered.filter(s => s.floor === floor);
  }

  get filtered(): ParkingSpot[] {
    return this.spots.filter(s =>
      (this.filterFloor === null || s.floor === this.filterFloor) &&
      (this.filterType === null || s.spotType === this.filterType) &&
      (!this.filterEV || s.isEVCharging) &&
      (!this.filterHandicap || s.isHandicapped)
    );
  }

  spotClass(s: ParkingSpot): string {
    const base = `spot status-${s.status}`;
    const extras = [];
    if (s.isEVCharging) extras.push('ev');
    if (s.isHandicapped) extras.push('handi');
    if (this.selectedSpot?.spotId === s.spotId) extras.push('selected');
    return base + ' ' + extras.join(' ');
  }

  selectSpot(s: ParkingSpot): void {
    if (s.status !== SpotStatus.Available) return;
    if (!this.auth.isLoggedIn) {
      this.toast.info('Sign in required', 'You can browse as a guest, but reservations need a driver account.');
      this.router.navigate(['/login']);
      return;
    }
    this.selectedSpot = s;
    this.selectedVehicle = this.vehicles[0] ?? null;
    this.bookingError = '';
    this.bookingSuccess = false;
    this.paymentError = '';
    this.paymentComplete = false;
    this.createdBooking = null;
    this.paymentOrder = null;
    this.selectedPaymentMode = this.bookingType === BookingType.WalkIn ? 'CASH' : 'UPI';
    this.showBookingModal = true;
  }

  closeModal(): void {
    this.showBookingModal = false;
    this.selectedSpot = null;
    this.createdBooking = null;
    this.paymentOrder = null;
    this.paymentError = '';
    this.paymentComplete = false;
  }

  get estimatedHours(): number {
    if (!this.startTime || !this.endTime) return 0;
    const start = new Date(this.startTime).getTime();
    const end = new Date(this.endTime).getTime();
    return Math.max(1, (end - start) / 3_600_000);
  }

  get estimatedAmount(): number {
    if (!this.selectedSpot) return 0;
    return +(this.estimatedHours * this.selectedSpot.pricePerHour).toFixed(2);
  }

  get isGuest(): boolean {
    return !this.auth.isLoggedIn;
  }

  confirmBooking(): void {
    if (!this.selectedSpot || !this.selectedVehicle || !this.lot || !this.auth.currentUser) return;
    if (new Date(this.endTime) <= new Date(this.startTime)) {
      this.bookingError = 'End time must be after start time.';
      return;
    }

    this.bookingLoading = true;
    this.bookingError = '';

    this.bookings$.create({
      userId: this.auth.currentUser.id,
      lotId: this.lot.id,
      spotId: this.selectedSpot.spotId,
      vehicleId: this.selectedVehicle.vehicleId,
      vehiclePlate: this.selectedVehicle.licensePlate,
      bookingType: this.bookingType,
      startTimeUtc: new Date(this.startTime).toISOString(),
      endTimeUtc: new Date(this.endTime).toISOString(),
      estimatedAmount: this.estimatedAmount,
      notes: ''
    }).subscribe({
      next: booking => {
        this.bookingLoading = false;
        this.createdBooking = booking;
        // Mark spot reserved locally
        if (this.selectedSpot) this.selectedSpot.status = SpotStatus.Reserved;

        if (this.bookingType === BookingType.PreBooking && this.estimatedAmount > 0) {
          this.startPayment(booking);
          return;
        }

        this.bookingSuccess = true;
        setTimeout(() => this.finishBookingFlow(), 1000);
      },
      error: err => {
        this.bookingLoading = false;
        this.bookingError = err.error?.message || 'Booking failed. Is the spot still available?';
      }
    });
  }

  private startPayment(booking: Booking): void {
    if (!this.auth.currentUser) return;

    if (this.isComingSoonMode()) {
      this.paymentError = `${this.paymentModeLabel()} is coming soon. Use UPI for online pre-booking.`;
      return;
    }

    this.paymentLoading = true;
    this.paymentError = '';

    this.payments$.createRazorpayOrder({
      bookingId: booking.id,
      userId: this.auth.currentUser.id,
      amount: booking.estimatedAmount || this.estimatedAmount,
      paymentMethod: this.paymentMethodEnum(),
      currency: 'INR',
      notes: `Pre-book ${this.paymentModeLabel()} checkout`
    }).subscribe({
      next: order => {
        this.paymentOrder = order;
        this.paymentLoading = false;
      },
      error: err => {
        this.paymentLoading = false;
        this.paymentError = this.cleanPaymentMessage(
          err.error?.message,
          'Could not start Razorpay checkout.'
        );
      }
    });
  }

  payWithRazorpay(): void {
    if (this.isComingSoonMode()) {
      this.paymentError = `${this.paymentModeLabel()} is coming soon.`;
      return;
    }

    if (!this.paymentOrder) {
      if (this.createdBooking) this.startPayment(this.createdBooking);
      return;
    }

    this.paymentLoading = true;
    this.paymentError = '';

    this.payments$.confirmRazorpayPayment({
      paymentId: this.paymentOrder.payment.id,
      razorpayOrderId: this.paymentOrder.order.id,
      notes: `${this.paymentModeLabel()} payment confirmed from frontend`
    }).subscribe({
      next: result => {
        this.paymentLoading = false;
        this.paymentComplete = result.status === 'Completed';
        this.bookingSuccess = true;
        this.toast.success('Payment complete', `${this.paymentModeLabel()} captured Rs. ${result.payment.amount}.`);
        setTimeout(() => this.finishBookingFlow(), 1000);
      },
      error: err => {
        this.paymentLoading = false;
        this.paymentError = this.cleanPaymentMessage(
          err.error?.message,
          'Razorpay confirmation failed.'
        );
      }
    });
  }

  skipPaymentForNow(): void {
    this.toast.warning('Payment pending', 'You can pay from your bookings page before check-in.');
    this.finishBookingFlow();
  }

  private finishBookingFlow(): void {
    this.closeModal();
    this.router.navigate(['/driver/bookings']);
  }

  private cleanPaymentMessage(message: string | undefined, fallback: string): string {
    if (!message) return fallback;
    return message
      .replace(/mock\s+/ig, '')
      .replace(/mock/ig, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  paymentModes(): readonly { value: string; label: string; enabled: boolean }[] {
    return this.bookingType === BookingType.WalkIn ? this.walkInModes : this.onlineModes;
  }

  onBookingTypeChanged(type: BookingType): void {
    this.bookingType = type;
    this.selectedPaymentMode = type === BookingType.WalkIn ? 'CASH' : 'UPI';
    this.paymentError = '';
  }

  onPaymentModeChanged(): void {
    if (this.isComingSoonMode()) {
      this.paymentError = `${this.paymentModeLabel()} is coming soon.`;
      return;
    }
    this.paymentError = '';
  }

  private isComingSoonMode(): boolean {
    const mode = this.paymentModes().find(x => x.value === this.selectedPaymentMode);
    return !!mode && !mode.enabled;
  }

  private paymentModeLabel(): string {
    return this.paymentModes().find(x => x.value === this.selectedPaymentMode)?.label || this.selectedPaymentMode;
  }

  private paymentMethodEnum(): PaymentMethod {
    switch (this.selectedPaymentMode) {
      case 'CARD': return PaymentMethod.Card;
      case 'NETBANKING': return PaymentMethod.NetBanking;
      case 'CASH': return PaymentMethod.Cash;
      default: return PaymentMethod.Upi;
    }
  }

  get available(): number { return this.spots.filter(s => s.status === SpotStatus.Available).length; }
  get reserved(): number { return this.spots.filter(s => s.status === SpotStatus.Reserved).length; }
  get occupied(): number { return this.spots.filter(s => s.status === SpotStatus.Occupied).length; }
}

import { Component, OnInit } from '@angular/core';
import { BookingService, NotificationService, PaymentService, SpotService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import {
  Booking,
  BookingStatus,
  BookingStatusLabel,
  BookingType,
  CheckoutReceipt,
  PaymentMethod,
  PaymentState,
  ParkingSpot
} from '../../../core/models/api-models';

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './my-bookings.component.scss']
})
export class MyBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = true;
  filter: 'ALL' | 'UPCOMING' | 'ACTIVE' | 'PAST' = 'UPCOMING';
  actionError = '';
  actionLoadingId: number | null = null;
  paymentLoadingId: number | null = null;
  receipt: CheckoutReceipt | null = null;

  readonly BookingStatus = BookingStatus;
  readonly BookingType = BookingType;
  readonly PaymentState = PaymentState;
  readonly statusLabel = BookingStatusLabel;

  constructor(
    private bookings$: BookingService,
    private payments$: PaymentService,
    private spots$: SpotService,
    private notifications$: NotificationService,
    private auth: AuthService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;

    this.loading = true;
    this.bookings$.getByUser(userId).subscribe({
      next: list => {
        this.bookings = (Array.isArray(list) ? list : [])
          .sort((a, b) => this.createdMs(b) - this.createdMs(a));
        this.sendExpiryReminders(userId);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filtered(): Booking[] {
    switch (this.filter) {
      case 'UPCOMING':
        return this.bookings.filter(b => b.status === BookingStatus.Reserved);
      case 'ACTIVE':
        return this.bookings.filter(b => b.status === BookingStatus.Active);
      case 'PAST':
        return this.bookings.filter(
          b => b.status === BookingStatus.Completed ||
            b.status === BookingStatus.Cancelled ||
            b.status === BookingStatus.NoShow
        );
      default:
        return this.bookings;
    }
  }

  statusClass(s: BookingStatus): string {
    switch (s) {
      case BookingStatus.Reserved:
        return 'amber';
      case BookingStatus.Active:
        return 'cyan';
      case BookingStatus.Completed:
        return 'lime';
      case BookingStatus.Cancelled:
      case BookingStatus.NoShow:
        return 'rose';
      default:
        return 'amber';
    }
  }

  paymentLabel(state: PaymentState): string {
    switch (state) {
      case PaymentState.Paid:
        return 'PAID';
      case PaymentState.Pending:
        return 'PAYMENT DUE';
      case PaymentState.Failed:
        return 'FAILED';
      case PaymentState.Refunded:
        return 'REFUNDED';
      default:
        return 'NO PAYMENT';
    }
  }

  canCheckIn(b: Booking): boolean {
    return b.status === BookingStatus.Reserved &&
      (b.paymentState === PaymentState.Paid ||
        b.paymentState === PaymentState.NotRequired);
  }

  canCheckOut(b: Booking): boolean {
    return b.status === BookingStatus.Active;
  }

  canCancel(b: Booking): boolean {
    return b.status === BookingStatus.Reserved;
  }

  canEdit(b: Booking): boolean {
    return b.status === BookingStatus.Reserved;
  }

  startLabel(b: Booking): string {
    return b.status === BookingStatus.Active || b.status === BookingStatus.Completed
      ? 'CHECK IN'
      : 'RESERVED START';
  }

  endLabel(b: Booking): string {
    return b.status === BookingStatus.Completed ? 'CHECK OUT' : 'RESERVED END';
  }

  displayStartTime(b: Booking): string {
    return b.checkInTimeUtc || b.startTimeUtc;
  }

  displayEndTime(b: Booking): string {
    return b.status === BookingStatus.Completed && b.checkOutTimeUtc
      ? b.checkOutTimeUtc
      : b.endTimeUtc;
  }

  lateText(b: Booking): string {
    if (!b.checkInTimeUtc) return '';
    const lateMs = new Date(b.checkInTimeUtc).getTime() - new Date(b.startTimeUtc).getTime();
    if (lateMs <= 0) return '';
    const mins = Math.ceil(lateMs / 60_000);
    return `${mins} min late`;
  }

  canPay(b: Booking): boolean {
    return b.bookingType === BookingType.PreBooking &&
      b.paymentState === PaymentState.Pending &&
      b.status === BookingStatus.Reserved;
  }

  async cancel(b: Booking): Promise<void> {
    const res = await this.confirm.ask({
      title: 'Cancel this booking?',
      message: `Booking #${b.id} for ${b.vehiclePlate} will be cancelled. If a refund is owed, it will be credited back automatically.`,
      confirmLabel: 'Cancel booking',
      danger: true,
      promptDefault: '',
      promptLabel: 'Reason (optional)'
    });

    if (!res.confirmed) return;

    this.actionLoadingId = b.id;
    this.actionError = '';

    this.bookings$.cancel(b.id, res.value ?? '').subscribe({
      next: updated => {
        Object.assign(b, updated);
        this.actionLoadingId = null;
        this.toast.success('Booking cancelled', `#${b.id} has been cancelled.`);
      },
      error: err => {
        this.actionLoadingId = null;
        this.actionError = err.error?.message || 'Could not cancel.';
        this.toast.error('Cancel failed', this.actionError);
      }
    });
  }

  checkIn(b: Booking): void {
    this.actionLoadingId = b.id;
    this.actionError = '';

    this.bookings$.checkIn(b.id).subscribe({
      next: updated => {
        Object.assign(b, updated);
        this.actionLoadingId = null;
        this.toast.success('Checked in', `Spot #${b.spotId} is now occupied.`);
      },
      error: err => {
        this.actionLoadingId = null;
        this.actionError = err.error?.message || 'Check-in failed.';
        this.toast.error('Check-in failed', this.actionError);
      }
    });
  }

  editReservation(b: Booking): void {
    const newStart = prompt(
      'New reservation start time (YYYY-MM-DDTHH:mm)',
      this.toLocalInput(new Date(b.startTimeUtc))
    );
    if (!newStart) return;

    const newEnd = prompt(
      'New reservation end time (YYYY-MM-DDTHH:mm)',
      this.toLocalInput(new Date(b.endTimeUtc))
    );
    if (!newEnd) return;

    const startUtc = new Date(newStart).toISOString();
    const endUtc = new Date(newEnd).toISOString();

    if (new Date(endUtc) <= new Date(startUtc)) {
      this.actionError = 'New end time must be after new start time.';
      return;
    }

    this.actionLoadingId = b.id;
    this.actionError = '';

    this.bookings$.getByLot(b.lotId).subscribe({
      next: bookings => {
        if (!this.hasSlotConflict(bookings, b.spotId, startUtc, endUtc, b.id)) {
          this.applyReservationEdit(b, startUtc, endUtc);
          return;
        }

        this.spots$.getByLot(b.lotId).subscribe({
          next: spots => this.resolveAlternateSpot(b, bookings, spots, startUtc, endUtc),
          error: () => {
            this.actionLoadingId = null;
            this.actionError = 'Could not check alternate spots.';
          }
        });
      },
      error: () => {
        this.actionLoadingId = null;
        this.actionError = 'Could not check reservation availability.';
      }
    });
  }

  checkOut(b: Booking): void {
    this.actionLoadingId = b.id;
    this.actionError = '';

    this.bookings$.farePreview(b.id).subscribe({
      next: fare => this.completeCheckout(b, fare.finalAmount),
      error: () => this.completeCheckout(b)
    });
  }

  payNow(b: Booking): void {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;

    this.paymentLoadingId = b.id;
    this.actionError = '';

    this.payments$.createRazorpayOrder({
      bookingId: b.id,
      userId,
      amount: b.estimatedAmount || 1,
      paymentMethod: PaymentMethod.Upi,
      currency: 'INR',
      notes: 'Pre-book Razorpay payment from bookings page'
    }).subscribe({
      next: order => {
        this.payments$.confirmRazorpayPayment({
          paymentId: order.payment.id,
          razorpayOrderId: order.order.id,
          notes: 'Razorpay payment confirmed from bookings page'
        }).subscribe({
          next: () => {
            b.paymentState = PaymentState.Paid;
            this.paymentLoadingId = null;
            this.toast.success('Payment complete', `Booking #${b.id} is paid.`);
          },
          error: err => {
            this.paymentLoadingId = null;
            this.actionError = this.cleanPaymentMessage(
              err.error?.message,
              'Payment confirmation failed.'
            );
            this.toast.error('Payment failed', this.actionError);
          }
        });
      },
      error: err => {
        this.paymentLoadingId = null;
        this.actionError = this.cleanPaymentMessage(
          err.error?.message,
          'Could not start Razorpay payment.'
        );
        this.toast.error('Payment failed', this.actionError);
      }
    });
  }

  closeReceipt(): void {
    this.receipt = null;
  }

  printReceipt(): void {
    setTimeout(() => window.print(), 250);
  }

  private completeCheckout(b: Booking, finalAmount?: number): void {
    this.bookings$.checkOut(b.id, finalAmount).subscribe({
      next: rawReceipt => {
        const receipt = this.normalizeCheckoutReceipt(rawReceipt, b);
        this.applyCheckoutReceipt(b, receipt);
        this.receipt = receipt;
        this.actionLoadingId = null;
        this.toast.success('Checked out', `Final fare Rs. ${receipt.finalAmount}.`);
        this.printReceipt();
      },
      error: err => {
        this.actionLoadingId = null;
        this.actionError = err.error?.message || 'Check-out failed.';
        this.toast.error('Check-out failed', this.actionError);
      }
    });
  }

  private applyCheckoutReceipt(b: Booking, receipt: CheckoutReceipt): void {
    b.status = receipt.status;
    b.paymentState = receipt.paymentState;
    b.finalAmount = receipt.finalAmount;
    b.checkOutTimeUtc = receipt.checkOutTimeUtc;
    b.estimatedAmount = receipt.estimatedAmount;
  }

  receiptDuration(receipt: CheckoutReceipt): string {
    const start = new Date(receipt.checkInTimeUtc || receipt.startTimeUtc).getTime();
    const end = new Date(receipt.checkOutTimeUtc).getTime();
    const seconds = Math.max(0, Math.ceil((end - start) / 1000));

    if (seconds < 60) return `${seconds} sec`;

    const minutes = Math.floor(seconds / 60);
    const remSeconds = seconds % 60;
    if (minutes < 60) {
      return remSeconds ? `${minutes} min ${remSeconds} sec` : `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return remMinutes ? `${hours} hr ${remMinutes} min` : `${hours} hr`;
  }

  billableDuration(receipt: CheckoutReceipt): string {
    if (receipt.billableHours) {
      return this.formatHours(receipt.billableHours);
    }

    const start = new Date(receipt.checkInTimeUtc || receipt.startTimeUtc).getTime();
    const end = new Date(receipt.checkOutTimeUtc).getTime();
    const minutes = Math.max(1, Math.ceil((end - start) / 60_000));
    return this.formatHours(minutes / 60);
  }

  private normalizeCheckoutReceipt(raw: any, b: Booking): CheckoutReceipt {
    const source = raw?.data ?? raw ?? {};
    const checkedOutAt = source.checkOutTimeUtc ?? b.checkOutTimeUtc ?? new Date().toISOString();
    const checkedInAt = source.checkInTimeUtc ?? b.checkInTimeUtc ?? b.startTimeUtc;
    const amount = Number(source.finalAmount ?? b.finalAmount ?? b.estimatedAmount ?? 0);

    return {
      receiptNumber: source.receiptNumber ?? `PE-${new Date(checkedOutAt).toISOString().slice(0, 10).replace(/-/g, '')}-${String(source.bookingId ?? b.id).padStart(6, '0')}`,
      issuedAtUtc: source.issuedAtUtc ?? checkedOutAt,
      bookingId: source.bookingId ?? raw?.bookingId ?? b.id,
      userId: source.userId ?? b.userId,
      lotId: source.lotId ?? b.lotId,
      spotId: source.spotId ?? b.spotId,
      vehicleId: source.vehicleId ?? b.vehicleId,
      vehiclePlate: source.vehiclePlate ?? b.vehiclePlate,
      bookingType: source.bookingType ?? b.bookingType,
      status: source.status ?? BookingStatus.Completed,
      paymentState: source.paymentState ?? b.paymentState,
      startTimeUtc: source.startTimeUtc ?? b.startTimeUtc,
      endTimeUtc: source.endTimeUtc ?? b.endTimeUtc,
      checkInTimeUtc: checkedInAt,
      checkOutTimeUtc: checkedOutAt,
      estimatedAmount: Number(source.estimatedAmount ?? b.estimatedAmount ?? amount),
      finalAmount: amount,
      lateFee: Number(source.lateFee ?? 0),
      billableHours: Number(source.billableHours ?? this.estimatedBillableHours(checkedInAt, checkedOutAt))
    };
  }

  private resolveAlternateSpot(
    b: Booking,
    bookings: Booking[],
    spots: ParkingSpot[],
    startUtc: string,
    endUtc: string
  ): void {
    const alternative = spots.find(s =>
      s.spotId !== b.spotId &&
      !this.hasSlotConflict(bookings, s.spotId, startUtc, endUtc, b.id)
    );

    if (alternative) {
      const changeSpot = confirm(
        `Same spot is unavailable at that time. Spot #${alternative.spotNumber} is available. Change to that spot?`
      );

      if (changeSpot) {
        this.applyReservationEdit(b, startUtc, endUtc, alternative.spotId);
        return;
      }
    }

    const cancel = confirm(
      'No other spot is available for that time. Cancel your reservation? Press Cancel to keep the original reservation.'
    );

    if (cancel) {
      this.cancelAfterEditConflict(b);
      return;
    }

    this.actionLoadingId = null;
  }

  private applyReservationEdit(
    b: Booking,
    startUtc: string,
    endUtc: string,
    spotId?: number
  ): void {
    this.bookings$.extend(b.id, {
      newStartTimeUtc: startUtc,
      newEndTimeUtc: endUtc,
      newSpotId: spotId
    }).subscribe({
      next: updated => {
        Object.assign(b, updated);
        this.actionLoadingId = null;
        this.toast.success('Reservation updated', `Booking #${b.id} has been moved.`);
      },
      error: err => {
        this.actionLoadingId = null;
        this.actionError = err.error?.message || 'Could not update reservation.';
      }
    });
  }

  private cancelAfterEditConflict(b: Booking): void {
    this.bookings$.cancel(b.id, 'Cancelled while editing reservation time').subscribe({
      next: updated => {
        Object.assign(b, updated);
        this.actionLoadingId = null;
        this.toast.success('Reservation cancelled', `Booking #${b.id} has been cancelled.`);
      },
      error: err => {
        this.actionLoadingId = null;
        this.actionError = err.error?.message || 'Could not cancel reservation.';
      }
    });
  }

  private hasSlotConflict(
    bookings: Booking[],
    spotId: number,
    startUtc: string,
    endUtc: string,
    currentBookingId: number
  ): boolean {
    const start = new Date(startUtc).getTime();
    const end = new Date(endUtc).getTime();

    return bookings.some(x =>
      x.id !== currentBookingId &&
      x.spotId === spotId &&
      x.status !== BookingStatus.Cancelled &&
      x.status !== BookingStatus.Completed &&
      x.status !== BookingStatus.Expired &&
      x.status !== BookingStatus.NoShow &&
      start < new Date(x.endTimeUtc).getTime() &&
      end > new Date(x.startTimeUtc).getTime()
    );
  }

  private toLocalInput(d: Date): string {
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16);
  }

  private estimatedBillableHours(startUtc: string, endUtc: string): number {
    const start = new Date(startUtc).getTime();
    const end = new Date(endUtc).getTime();
    const minutes = Math.max(1, Math.ceil((end - start) / 60_000));
    return +(minutes / 60).toFixed(2);
  }

  private formatHours(hours: number): string {
    const minutes = Math.max(1, Math.round(hours * 60));
    if (minutes < 60) return `${minutes} min`;

    const wholeHours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    const hourText = `${wholeHours} hr${wholeHours === 1 ? '' : 's'}`;
    return remMinutes ? `${hourText} ${remMinutes} min` : hourText;
  }

  private createdMs(b: Booking): number {
    return +new Date(b.createdAtUtc || b.createdAt || b.startTimeUtc);
  }

  private sendExpiryReminders(userId: number): void {
    const now = Date.now();

    this.bookings
      .filter(b => b.status === BookingStatus.Active)
      .forEach(b => {
        const endMs = new Date(b.endTimeUtc).getTime();
        const minutesLeft = Math.ceil((endMs - now) / 60_000);
        const key = `parkease.expiryReminder.${b.id}`;

        if (minutesLeft < 0 || minutesLeft > 10 || localStorage.getItem(key)) return;

        localStorage.setItem(key, 'sent');
        const message = `Booking #${b.id} for ${b.vehiclePlate} ends in ${Math.max(0, minutesLeft)} minutes. Extend or check out soon.`;
        this.toast.warning('Reservation ending soon', message, 7000);
        this.notifications$.send(
          userId,
          'Reservation ending soon',
          message,
          '1',
          '3',
          b.id,
          'Booking'
        ).subscribe({ error: () => undefined });
      });
  }

  private cleanPaymentMessage(message: string | undefined, fallback: string): string {
    if (!message) return fallback;
    return message
      .replace(/mock\s+/ig, '')
      .replace(/mock/ig, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
}

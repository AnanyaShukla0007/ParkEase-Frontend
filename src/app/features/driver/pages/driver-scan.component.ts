import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/api.services';
import { ToastService } from '../../../core/services/toast.service';
import { QrService } from '../../../core/services/qr.service';
import { DeviceService } from '../../../core/services/device.service';
import {
  Booking,
  BookingQrPayload,
  BookingStatus,
  CheckoutReceipt
} from '../../../core/models/api-models';

@Component({
  selector: 'app-driver-scan',
  templateUrl: './driver-scan.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './driver-scan.component.scss']
})
export class DriverScanComponent implements OnInit, OnDestroy {
  @ViewChild('video', { static: false }) videoRef?: ElementRef<HTMLVideoElement>;

  scanning = false;
  decoded: BookingQrPayload | null = null;
  booking: Booking | null = null;
  busy = false;
  status = '';
  manualInput = '';

  private stream: MediaStream | null = null;

  constructor(
    public device: DeviceService,
    private qr: QrService,
    private bookings$: BookingService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.device.isMobile) {
      setTimeout(() => this.startCamera(), 100);
    }
  }

  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      this.scanning = true;
      this.status = 'Point the camera at your ParkEase pass';
      setTimeout(() => {
        if (this.videoRef && this.stream) {
          this.videoRef.nativeElement.srcObject = this.stream;
          this.videoRef.nativeElement.play();
        }
      }, 50);
    } catch {
      this.scanning = false;
      this.status = 'Camera unavailable. Use the manual code entry below.';
      this.toast.warning('Camera blocked', 'Allow camera access or paste the pass code manually.');
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  decodeManual(): void {
    if (!this.manualInput.trim()) return;
    this.processPayload(this.manualInput.trim());
  }

  processPayload(encoded: string): void {
    const decoded = this.qr.decodePayload<BookingQrPayload>(encoded);
    if (!decoded || !decoded.bookingId) {
      this.toast.error('Could not read pass', 'The QR code is not a valid ParkEase pass.');
      return;
    }
    this.decoded = decoded;
    this.lookupAndAct(decoded);
  }

  private lookupAndAct(p: BookingQrPayload): void {
    this.busy = true;
    this.status = `Looking up booking #${p.bookingId}...`;
    this.bookings$.getById(p.bookingId).subscribe({
      next: b => {
        this.booking = b;
        if (b.status === BookingStatus.Reserved) {
          this.doCheckIn(b);
        } else if (b.status === BookingStatus.Active) {
          this.doCheckOut(b);
        } else {
          this.busy = false;
          this.status = 'This booking is already completed or cancelled.';
          this.toast.info('No action', 'This pass is no longer active.');
        }
      },
      error: () => {
        this.busy = false;
        this.status = 'Booking not found. The pass may be invalid or expired.';
        this.toast.error('Booking not found');
      }
    });
  }

  private doCheckIn(b: Booking): void {
    this.status = 'Checking you in...';
    this.bookings$.checkIn(b.id).subscribe({
      next: updated => {
        this.booking = updated;
        this.busy = false;
        this.status = `Checked in - Spot #${b.spotId} is yours.`;
        this.toast.success('Welcome!', `Checked into Spot #${b.spotId}.`);
        this.stopCamera();
      },
      error: err => {
        this.busy = false;
        this.status = err.error?.message || 'Check-in failed.';
        this.toast.error('Check-in failed', this.status);
      }
    });
  }

  private doCheckOut(b: Booking): void {
    this.status = 'Checking you out and computing fare...';
    this.bookings$.farePreview(b.id).subscribe({
      next: fare => {
        this.bookings$.checkOut(b.id, fare.finalAmount).subscribe({
          next: receipt => this.finishCheckout(b, receipt),
          error: err => {
            this.busy = false;
            this.status = err.error?.message || 'Check-out failed.';
            this.toast.error('Check-out failed', this.status);
          }
        });
      },
      error: () => {
        this.bookings$.checkOut(b.id, b.estimatedAmount).subscribe({
          next: receipt => this.finishCheckout(b, receipt),
          error: err => {
            this.busy = false;
            this.status = err.error?.message || 'Check-out failed.';
          }
        });
      }
    });
  }

  private finishCheckout(b: Booking, receipt: CheckoutReceipt): void {
    this.booking = {
      ...b,
      status: receipt.status,
      paymentState: receipt.paymentState,
      checkOutTimeUtc: receipt.checkOutTimeUtc,
      finalAmount: receipt.finalAmount
    };
    this.busy = false;
    this.status = `Checked out - total Rs. ${receipt.finalAmount}.`;
    this.toast.success('Safe travels', `Total fare Rs. ${receipt.finalAmount}.`);
    this.stopCamera();
  }

  done(): void {
    this.router.navigate(['/driver/bookings']);
  }
}

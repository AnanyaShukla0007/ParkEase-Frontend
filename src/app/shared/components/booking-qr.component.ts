import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QrService } from '../../core/services/qr.service';
import { DeviceService } from '../../core/services/device.service';
import { Booking, BookingQrPayload } from '../../core/models/api-models';

/**
 * Mobile-only QR pass for an active booking. The scanner page reads the
 * embedded payload (booking id + signature) and either checks the user
 * in (first scan) or checks them out (second scan). On desktop this
 * component renders a friendly hint instead — the QR pass is mobile-only
 * by design (case study item #14).
 */
@Component({
  selector: 'app-booking-qr',
  template: `
    <div class="qr-card" *ngIf="device.isMobile">
      <div class="qr-frame" [innerHTML]="svg"></div>
      <div class="qr-meta">
        <div class="qr-title mono">PARK PASS · #{{ booking.id }}</div>
        <div class="qr-line">{{ booking.vehiclePlate }}</div>
        <div class="qr-line dim">Spot #{{ booking.spotId }} · Lot #{{ booking.lotId }}</div>
        <div class="qr-hint mono">{{ scanHint }}</div>
      </div>
    </div>
    <div class="qr-desktop-note" *ngIf="!device.isMobile">
      <span class="mono">📱 OPEN ON YOUR PHONE</span>
      <span class="qr-desktop-msg">
        Your scannable park-pass QR is generated on the mobile app —
        scan at the lot entry to auto check-in.
      </span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .qr-card {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 16px;
      align-items: center;
      padding: 18px;
      background: linear-gradient(135deg, rgba(94, 234, 212, 0.06), rgba(255, 216, 77, 0.04));
      border: 1px solid rgba(94, 234, 212, 0.3);
      border-radius: 14px;
      margin-top: 14px;
    }
    .qr-frame {
      width: 132px; height: 132px;
      background: var(--paper, #f4ecd8);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 0 24px rgba(94, 234, 212, 0.25);
    }
    :host ::ng-deep .qr-frame svg { width: 100%; height: 100%; display: block; }
    .qr-meta { min-width: 0; }
    .qr-title {
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      color: var(--cyan, #5eead4);
      margin-bottom: 6px;
    }
    .qr-line {
      color: var(--paper, #f4ecd8);
      font-weight: 600;
      font-size: 1rem;
    }
    .qr-line.dim {
      color: var(--text-dim, #8a9bc0);
      font-weight: 400;
      font-size: 0.85rem;
      margin-top: 2px;
    }
    .qr-hint {
      font-size: 0.65rem;
      letter-spacing: 0.16em;
      color: var(--lime, #c6ff4d);
      margin-top: 12px;
    }
    .qr-desktop-note {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed var(--border, rgba(255, 216, 77, 0.12));
      border-radius: 10px;
      margin-top: 12px;
      font-size: 0.78rem;
    }
    .qr-desktop-note .mono {
      color: var(--cyan, #5eead4);
      letter-spacing: 0.16em;
    }
    .qr-desktop-msg {
      color: var(--text-dim, #8a9bc0);
      line-height: 1.5;
    }
  `]
})
export class BookingQrComponent implements OnInit, OnChanges {
  @Input() booking!: Booking;
  /** 'CHECK_IN' once the booking is reserved; 'CHECK_OUT' once active */
  @Input() scanHint = 'SCAN AT LOT ENTRY';

  svg: SafeHtml = '';

  constructor(
    public device: DeviceService,
    private qr: QrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void { this.regenerate(); }
  ngOnChanges(): void { this.regenerate(); }

  private regenerate(): void {
    if (!this.booking) return;
    const payload: BookingQrPayload = {
      bookingId: this.booking.id,
      userId: this.booking.userId,
      spotId: this.booking.spotId,
      vehiclePlate: this.booking.vehiclePlate,
      signature: this.qr.encodePayload({
        b: this.booking.id,
        u: this.booking.userId,
        s: this.booking.spotId,
        t: Date.now()
      })
    };
    const text = this.qr.encodePayload(payload);
    this.svg = this.sanitizer.bypassSecurityTrustHtml(this.qr.buildSvg(text, 6));
  }
}

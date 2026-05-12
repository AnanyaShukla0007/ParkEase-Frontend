import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../core/services/api.services';
import { Booking, BookingStatus, BookingStatusLabel, BookingType } from '../../../core/models/api-models';

@Component({
  selector: 'app-admin-bookings',
  templateUrl: './admin-bookings.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './admin-bookings.component.scss']
})
export class AdminBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = true;
  filter: 'ALL' | 'ACTIVE' | 'RESERVED' | 'COMPLETED' | 'CANCELLED' = 'ALL';
  search = '';
  actionId: number | null = null;
  error = '';

  readonly BookingStatus = BookingStatus;
  readonly BookingType = BookingType;
  readonly statusLabel = BookingStatusLabel;

  constructor(private bookings$: BookingService) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.bookings$.getAll().subscribe({
      next: list => {
        this.bookings = list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get counts() {
    return {
      total: this.bookings.length,
      active: this.bookings.filter(b => b.status === BookingStatus.Active).length,
      reserved: this.bookings.filter(b => b.status === BookingStatus.Reserved).length,
      completed: this.bookings.filter(b => b.status === BookingStatus.Completed).length,
      cancelled: this.bookings.filter(b => b.status === BookingStatus.Cancelled).length,
      revenue: this.bookings.filter(b => b.status === BookingStatus.Completed).reduce((s, b) => s + (b.finalAmount ?? 0), 0)
    };
  }

  get filtered(): Booking[] {
    let list = this.bookings;
    if (this.filter !== 'ALL') {
      const statusMap: Record<string, BookingStatus> = {
        ACTIVE: BookingStatus.Active, RESERVED: BookingStatus.Reserved,
        COMPLETED: BookingStatus.Completed, CANCELLED: BookingStatus.Cancelled
      };
      list = list.filter(b => b.status === statusMap[this.filter]);
    }
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      list = list.filter(b => b.vehiclePlate.toLowerCase().includes(q) || String(b.id).includes(q) || String(b.userId).includes(q));
    }
    return list;
  }

  statusClass(s: BookingStatus): string {
    switch (s) {
      case BookingStatus.Reserved: return 'amber';
      case BookingStatus.Active: return 'cyan';
      case BookingStatus.Completed: return 'lime';
      case BookingStatus.Cancelled: return 'rose';
      default: return 'amber';
    }
  }

  forceCheckout(b: Booking): void {
    if (!confirm(`Force checkout booking #${b.id}?`)) return;
    this.actionId = b.id;
    this.error = '';
    this.bookings$.checkOut(b.id, b.estimatedAmount).subscribe({
      next: receipt => {
        b.status = receipt.status;
        b.paymentState = receipt.paymentState;
        b.finalAmount = receipt.finalAmount;
        b.checkOutTimeUtc = receipt.checkOutTimeUtc;
        this.actionId = null;
      },
      error: err => { this.actionId = null; this.error = err.error?.message || 'Force checkout failed.'; }
    });
  }

  cancel(b: Booking): void {
    if (!confirm(`Cancel booking #${b.id}?`)) return;
    this.actionId = b.id;
    this.bookings$.cancel(b.id, 'Admin cancellation').subscribe({
      next: updated => { Object.assign(b, updated); this.actionId = null; },
      error: err => { this.actionId = null; this.error = err.error?.message || 'Cancel failed.'; }
    });
  }
}

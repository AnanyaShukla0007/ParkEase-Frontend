import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../core/services/api.services';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Booking,
  BookingStatus,
  BookingStatusLabel,
  ParkingLot
} from '../../../core/models/api-models';
import { forkJoin, of, catchError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-manager-bookings',
  templateUrl: './manager-bookings.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './manager-bookings.component.scss']
})
export class ManagerBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  lots: ParkingLot[] = [];
  loading = true;

  filter: 'ALL' | 'ACTIVE' | 'RESERVED' | 'COMPLETED' | 'CANCELLED' = 'ALL';
  selectedLotId: number | 'ALL' = 'ALL';
  search = '';
  actionId: number | null = null;
  error = '';

  readonly BookingStatus = BookingStatus;
  readonly statusLabel = BookingStatusLabel;

  constructor(
    private bookings$: BookingService,
    private lots$: ParkingLotService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const uid = this.auth.currentUser?.id;
    if (!uid) return;

    this.loading = true;

    this.lots$.getByManager(uid).pipe(
      switchMap(lots => {
        this.lots = lots;

        if (!lots.length) {
          return of([] as Booking[]);
        }

        const calls = lots.map(l =>
          this.bookings$
            .getByLot(l.id)
            .pipe(catchError(() => of([] as Booking[])))
        );

        return forkJoin(calls);
      })
    ).subscribe({
      next: (results: any) => {
        const all = Array.isArray(results[0])
          ? results.flat()
          : (results as Booking[]);

        this.bookings = all.sort(
          (a: Booking, b: Booking) =>
            +new Date(b.createdAt) - +new Date(a.createdAt)
        );

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get activeBookings(): Booking[] {
    return this.bookings.filter(
      b => b.status === BookingStatus.Active
    );
  }

  get reservedBookings(): Booking[] {
    return this.bookings.filter(
      b => b.status === BookingStatus.Reserved
    );
  }

  get completedBookings(): Booking[] {
    return this.bookings.filter(
      b => b.status === BookingStatus.Completed
    );
  }

  get cancelledBookings(): Booking[] {
    return this.bookings.filter(
      b => b.status === BookingStatus.Cancelled
    );
  }

  get filtered(): Booking[] {
    let list = this.bookings;

    if (this.selectedLotId !== 'ALL') {
      list = list.filter(b => b.lotId === this.selectedLotId);
    }

    if (this.filter !== 'ALL') {
      const statusMap: Record<string, BookingStatus> = {
        ACTIVE: BookingStatus.Active,
        RESERVED: BookingStatus.Reserved,
        COMPLETED: BookingStatus.Completed,
        CANCELLED: BookingStatus.Cancelled
      };

      list = list.filter(b => b.status === statusMap[this.filter]);
    }

    if (this.search.trim()) {
      const q = this.search.toLowerCase();

      list = list.filter(
        b =>
          b.vehiclePlate.toLowerCase().includes(q) ||
          String(b.id).includes(q)
      );
    }

    return list;
  }

  lotName(id: number): string {
    return this.lots.find(l => l.id === id)?.name || `Lot #${id}`;
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
        return 'rose';
      default:
        return '';
    }
  }

  forceCheckout(b: Booking): void {
    if (!confirm(`Force checkout for booking #${b.id}?`)) return;

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
      error: err => {
        this.actionId = null;
        this.error =
          err.error?.message || 'Force checkout failed.';
      }
    });
  }
}

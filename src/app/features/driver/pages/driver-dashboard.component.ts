import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService, BookingService, VehicleService, NotificationService } from '../../../core/services/api.services';
import { Booking, BookingStatus, Vehicle } from '../../../core/models/api-models';
import { Router } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-driver-dashboard',
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './driver-dashboard.component.scss']
})
export class DriverDashboardComponent implements OnInit {
  loading = true;
  bookings: Booking[] = [];
  vehicles: Vehicle[] = [];
  unreadCount = 0;
  trustScore = 100;
  carbonKg = 0;
  minutesSaved = 0;

  readonly BookingStatus = BookingStatus;

  constructor(
    public auth: AuthService,
    private bookings$: BookingService,
    private vehicles$: VehicleService,
    private notify$: NotificationService,
    private analytics$: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;
    forkJoin({
      bookings: this.bookings$.getByUser(userId).pipe(catchError(() => of([] as Booking[]))),
      vehicles: this.vehicles$.getByOwner(userId).pipe(catchError(() => of([] as Vehicle[]))),
      unread: this.notify$.getUnreadCount(userId).pipe(catchError(() => of({ count: 0 }))),
      trust: this.analytics$.trustScore(userId).pipe(catchError(() => of(null))),
      carbon: this.analytics$.carbonSavings(userId).pipe(catchError(() => of(null)))
    }).subscribe(res => {
      this.bookings = res.bookings || [];
      this.vehicles = res.vehicles || [];
      this.unreadCount = res.unread?.count ?? 0;
      this.trustScore = +(res.trust?.score ?? res.trust?.trustScore ?? 100);
      this.carbonKg = +(res.carbon?.co2ReducedKg ?? res.carbon?.carbonSavedKg ?? res.carbon?.carbonSavingsKg ?? 0);
      this.minutesSaved = +(res.carbon?.minutesSaved ?? res.carbon?.idleMinutesSaved ?? 0);
      this.loading = false;
    });
  }

  get active(): number {
    return this.bookings.filter(b =>
      b.status === BookingStatus.Reserved || b.status === BookingStatus.Active
    ).length;
  }
  get completed(): number { return this.bookings.filter(b => b.status === BookingStatus.Completed).length; }
  get totalSpent(): number {
    return this.bookings
      .filter(b => b.status === BookingStatus.Completed)
      .reduce((s, b) => s + (b.finalAmount ?? 0), 0);
  }
  get upcoming(): Booking[] {
    return this.bookings
      .filter(b => b.status === BookingStatus.Reserved || b.status === BookingStatus.Active)
      .slice(0, 3);
  }

  statusLabel(b: Booking): string {
    switch (b.status) {
      case BookingStatus.Reserved: return 'RESERVED';
      case BookingStatus.Active: return 'ACTIVE';
      case BookingStatus.Completed: return 'DONE';
      case BookingStatus.Cancelled: return 'CANCELLED';
      default: return 'PENDING';
    }
  }

  go(path: string): void { this.router.navigate([path]); }
}

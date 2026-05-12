import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { BookingService } from '../../../core/services/api.services';
import { ParkingLot, Booking, BookingStatus } from '../../../core/models/api-models';
import { forkJoin, of, catchError } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './manager-dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit {
  loading = true;
  lots: ParkingLot[] = [];
  recentBookings: Booking[] = [];

  readonly BookingStatus = BookingStatus;

  constructor(
    public auth: AuthService,
    private lots$: ParkingLotService,
    private bookings$: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;
    this.lots$.getByManager(userId).pipe(
      catchError(() => of([] as ParkingLot[]))
    ).subscribe(lots => {
      this.lots = lots;
      // Pull recent bookings across all their lots
      if (!lots.length) { this.loading = false; return; }
      const reqs = lots.slice(0, 5).map(l =>
        this.bookings$.getByLot(l.id).pipe(catchError(() => of([] as Booking[])))
      );
      forkJoin(reqs).subscribe(results => {
        this.recentBookings = results
          .flat()
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 6);
        this.loading = false;
      });
    });
  }

  get totalLots(): number { return this.lots.length; }
  get approvedLots(): number { return this.lots.filter(l => l.isApproved).length; }
  get totalSpots(): number { return this.lots.reduce((s, l) => s + l.totalSpots, 0); }
  get availableSpots(): number { return this.lots.reduce((s, l) => s + l.availableSpots, 0); }
  get occupancy(): number {
    return this.totalSpots === 0
      ? 0
      : Math.round(100 * (1 - this.availableSpots / this.totalSpots));
  }

  go(path: string): void { this.router.navigate([path]); }
}

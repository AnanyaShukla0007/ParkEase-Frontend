import { Component, OnInit } from '@angular/core';
import { AnalyticsService, AdminUserService } from '../../../core/services/api.services';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { PlatformSummary, ParkingLot, User } from '../../../core/models/api-models';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  summary?: PlatformSummary;
  allLots: ParkingLot[] = [];
  allUsers: User[] = [];

  constructor(
    public auth: AuthService,
    private analytics$: AnalyticsService,
    private lots$: ParkingLotService,
    private users$: AdminUserService
  ) {}

  ngOnInit(): void {
    forkJoin({
      summary: this.analytics$.platformSummary().pipe(catchError(() => of(null))),
      lots: this.lots$.getAll().pipe(catchError(() => of([] as ParkingLot[]))),
      users: this.users$.getAllUsers().pipe(catchError(() => of([] as User[])))
    }).subscribe(res => {
      this.summary = res.summary || undefined;
      this.allLots = res.lots;
      this.allUsers = res.users;
      this.loading = false;
    });
  }

  get pendingApprovals(): number {
    return this.allLots.filter(l => !l.isApproved).length;
  }

  get approvedLots(): number {
    return this.allLots.filter(l => l.isApproved).length;
  }

  get drivers(): number {
    return this.allUsers.filter(u => u.role === 'DRIVER').length;
  }

  get managers(): number {
    return this.allUsers.filter(u => u.role === 'MANAGER').length;
  }

  get activeUsers(): number {
    return this.allUsers.filter(u => u.isActive).length;
  }

  get pendingLots(): ParkingLot[] {
    return this.allLots
      .filter(l => !l.isApproved)
      .slice(0, 4);
  }

  get topCities(): { city: string; count: number }[] {
    const map = new Map<string, number>();

    this.allLots.forEach(l => {
      map.set(l.city, (map.get(l.city) || 0) + 1);
    });

    return [...map.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  get maxCity(): number {
    return Math.max(1, ...this.topCities.map(c => c.count));
  }
}
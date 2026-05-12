import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../../core/services/api.services';
import { PlatformSummary } from '../../../core/models/api-models';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './admin-analytics.component.scss']
})
export class AdminAnalyticsComponent implements OnInit {
  summary?: PlatformSummary;
  demand: any[] = [];
  failedHours: any[] = [];
  loading = true;

  constructor(private analytics$: AnalyticsService) {}

  ngOnInit(): void {
    forkJoin({
      summary: this.analytics$.platformSummary().pipe(catchError(() => of(null))),
      demand: this.analytics$.demandHeatmap().pipe(catchError(() => of([]))),
      failed: this.analytics$.failedHours().pipe(catchError(() => of([])))
    }).subscribe(res => {
      this.summary = res.summary || undefined;
      this.demand = res.demand || [];
      this.failedHours = res.failed || [];
      this.loading = false;
    });
  }

  get occupancyWidth(): number {
    return Math.min(100, Math.round(this.summary?.occupancyRate ?? 0));
  }

  exportPlatformReport(): void {
    const rows = [
      ['Metric', 'Value'],
      ['Total users', this.summary?.totalUsers ?? 0],
      ['Total lots', this.summary?.totalLots ?? 0],
      ['Total bookings', this.summary?.totalBookings ?? 0],
      ['Active bookings', this.summary?.activeBookings ?? 0],
      ['Total revenue', this.summary?.totalRevenue ?? 0],
      ['Occupancy rate', this.summary?.occupancyRate ?? 0]
    ];
    this.downloadCsv('parkease-platform-report.csv', rows);
  }

  private downloadCsv(filename: string, rows: any[][]): void {
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

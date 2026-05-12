import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { AnalyticsService } from '../../../core/services/api.services';
import { ParkingLot } from '../../../core/models/api-models';
import { forkJoin, of, catchError } from 'rxjs';

interface BarDatum { label: string; value: number; }

@Component({
  selector: 'app-manager-analytics',
  templateUrl: './manager-analytics.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './manager-analytics.component.scss']
})
export class ManagerAnalyticsComponent implements OnInit {
  lotId = 0;
  lot?: ParkingLot;
  loading = true;

  occupancyRate = 0;
  peakHours: number[] = [];
  avgMinutes = 0;
  totalRevenue = 0;
  byHour: BarDatum[] = [];
  byDay: BarDatum[] = [];
  bySpotType: BarDatum[] = [];

  readonly Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lots$: ParkingLotService,
    private analytics$: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.lotId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.lotId) { this.router.navigate(['/manager/lots']); return; }
    this.load();
  }

  private load(): void {
    const to = new Date();
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    forkJoin({
      lot: this.lots$.getById(this.lotId).pipe(catchError(() => of(null as any))),
      rate: this.analytics$.occupancyRate(this.lotId).pipe(catchError(() => of({ rate: 0 }))),
      peak: this.analytics$.peakHours(this.lotId).pipe(catchError(() => of([] as number[]))),
      hourly: this.analytics$.byHour(this.lotId).pipe(catchError(() => of({} as Record<string, number>))),
      revenue: this.analytics$.revenue(this.lotId, from, to).pipe(catchError(() => of({ total: 0 }))),
      daily: this.analytics$.revenueByDay(this.lotId, from, to).pipe(catchError(() => of({} as Record<string, number>))),
      types: this.analytics$.spotTypes(this.lotId).pipe(catchError(() => of({} as Record<string, number>))),
      avg: this.analytics$.avgDuration(this.lotId).pipe(catchError(() => of({ minutes: 0 })))
    }).subscribe(res => {
      this.lot = res.lot;
      this.occupancyRate = Math.round(res.rate?.rate || 0);
      this.peakHours = res.peak || [];
      this.avgMinutes = Math.round(res.avg?.minutes || 0);
      this.totalRevenue = Math.round(res.revenue?.total || 0);
      this.byHour = this.toHourSeries(res.hourly);
      this.byDay = this.toDaySeries(res.daily);
      this.bySpotType = Object.entries(res.types || {}).map(([k, v]) => ({ label: k, value: v as number }));
      this.loading = false;
    });
  }

  private toHourSeries(data: Record<string, number>): BarDatum[] {
    const out: BarDatum[] = [];
    for (let h = 0; h < 24; h++) {
      const key = String(h);
      const label = h.toString().padStart(2, '0');
      out.push({ label, value: data[key] ?? data[label] ?? 0 });
    }
    return out;
  }

  private toDaySeries(data: Record<string, number>): BarDatum[] {
    const entries = Object.entries(data || {}).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => ({
      label: new Date(k).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      value: v as number
    }));
  }

  get maxHour(): number { return Math.max(1, ...this.byHour.map(d => d.value)); }
  get maxDay(): number { return Math.max(1, ...this.byDay.map(d => d.value)); }
  get maxType(): number { return Math.max(1, ...this.bySpotType.map(d => d.value)); }
  get hasHourlyData(): boolean {
  return this.byHour.some(d => d.value > 0);
}

get isEmpty(): boolean {
  return !this.hasHourlyData &&
         this.byDay.length === 0 &&
         this.bySpotType.length === 0;
}

  peakHourLabel(): string {
    if (!this.peakHours.length) return '—';
    return this.peakHours
      .slice(0, 3)
      .map(h => h.toString().padStart(2, '0') + ':00')
      .join(', ');
  }

  downloadDailyReport(): void {
    this.analytics$.dailyReport(this.lotId, new Date()).pipe(catchError(() => of(null))).subscribe(report => {
      if (!report) return;
      const rows = [
        ['Metric', 'Value'],
        ['Lot', this.lot?.name || this.lotId],
        ['Date', report.reportDate || new Date().toISOString()],
        ['Average occupancy', report.averageOccupancyRate ?? 0],
        ['Revenue', report.revenue ?? 0],
        ['Peak hour', report.peakHour ?? ''],
        ['Total sessions', report.totalSessions ?? report.bookingCount ?? 0]
      ];
      this.downloadCsv(`parkease-lot-${this.lotId}-daily-report.csv`, rows);
    });
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

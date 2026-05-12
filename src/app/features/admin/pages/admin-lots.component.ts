import { Component, OnInit } from '@angular/core';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ParkingLot } from '../../../core/models/api-models';

@Component({
  selector: 'app-admin-lots',
  templateUrl: './admin-lots.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './admin-lots.component.scss']
})
export class AdminLotsComponent implements OnInit {
  lots: ParkingLot[] = [];
  loading = true;
  filter: 'PENDING' | 'APPROVED' | 'ALL' = 'PENDING';
  actionId: number | null = null;
  error = '';

  constructor(
    private lots$: ParkingLotService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.lots$.getAll().subscribe({
      next: list => {
        this.lots = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get pendingLots(): ParkingLot[] { return this.lots.filter(l => !l.isApproved); }
  get approvedLots(): ParkingLot[] { return this.lots.filter(l => l.isApproved); }

  get filtered(): ParkingLot[] {
    switch (this.filter) {
      case 'PENDING': return this.pendingLots;
      case 'APPROVED': return this.approvedLots;
      default: return this.lots;
    }
  }

  /** Replace the lot in the list array so Angular's change detection
   *  picks up the update without a full reload — fixes the "have to
   *  refresh to see the change" bug. */
  private patch(updated: ParkingLot): void {
    this.lots = this.lots.map(l => l.id === updated.id ? { ...l, ...updated } : l);
  }

  approve(lot: ParkingLot): void {
    this.actionId = lot.id;
    this.error = '';
    this.lots$.approve(lot.id).subscribe({
      next: updated => {
        this.actionId = null;
        if (updated && updated.id) {
          this.patch(updated);
        } else {
          // Backend may not echo the lot — flip the flag locally
          this.patch({ ...lot, isApproved: true });
        }
        this.toast.success('Lot approved', `${lot.name} is now public.`);
      },
      error: err => {
        this.actionId = null;
        this.error = err.error?.message || 'Approval failed.';
        this.toast.error('Approval failed', this.error);
      }
    });
  }

  async reject(lot: ParkingLot): Promise<void> {
    const res = await this.confirm.ask({
      title: 'Reject this lot?',
      message: `"${lot.name}" will be marked rejected and stay hidden from drivers.`,
      confirmLabel: 'Reject',
      danger: true
    });
    if (!res.confirmed) return;

    this.actionId = lot.id;
    this.lots$.reject(lot.id).subscribe({
      next: updated => {
        this.actionId = null;
        if (updated && updated.id) {
          this.patch(updated);
        } else {
          this.patch({ ...lot, isApproved: false, isActive: false });
        }
        this.toast.warning('Lot rejected', lot.name);
      },
      error: err => {
        this.actionId = null;
        this.error = err.error?.message || 'Rejection failed.';
        this.toast.error('Rejection failed', this.error);
      }
    });
  }

  async delete(lot: ParkingLot): Promise<void> {
    const res = await this.confirm.ask({
      title: 'Delete permanently?',
      message: `"${lot.name}" and all its spots will be deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true
    });
    if (!res.confirmed) return;

    this.actionId = lot.id;
    this.lots$.delete(lot.id).subscribe({
      next: () => {
        this.actionId = null;
        this.lots = this.lots.filter(l => l.id !== lot.id);
        this.toast.success('Lot deleted', lot.name);
      },
      error: err => {
        this.actionId = null;
        this.error = err.error?.message || 'Delete failed.';
        this.toast.error('Delete failed', this.error);
      }
    });
  }
}

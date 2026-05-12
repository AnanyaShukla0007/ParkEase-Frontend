import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { AuthService } from '../../../core/services/auth.service';
import { GeolocationService } from '../../../core/services/geolocation.service';
import { ToastService } from '../../../core/services/toast.service';
import { ParkingLot } from '../../../core/models/api-models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager-lots',
  templateUrl: './manager-lots.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './manager-lots.component.scss']
})
export class ManagerLotsComponent implements OnInit {
  readonly Math = Math;
  lots: ParkingLot[] = [];
  loading = true;
  showForm = false;
  form: FormGroup;
  saving = false;
  error = '';
  locating = false;

  constructor(
    private fb: FormBuilder,
    private lots$: ParkingLotService,
    private auth: AuthService,
    private geo: GeolocationService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{4,10}$/)]],
      latitude: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
      totalSpots: [20, [Validators.required, Validators.min(1)]],
      openTime: ['06:00', Validators.required],
      closeTime: ['23:00', Validators.required],
      imageUrl: ['']
    });
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;
    this.loading = true;
    this.lots$.getByManager(userId).subscribe({
      next: list => { this.lots = Array.isArray(list) ? list : []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  open(): void { this.showForm = true; this.error = ''; }
  close(): void { this.showForm = false; }

  async useCurrentLocation(): Promise<void> {
    this.locating = true;
    const c = await this.geo.getPosition();
    this.form.patchValue({ latitude: +c.lat.toFixed(6), longitude: +c.lng.toFixed(6) });
    this.locating = false;
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const managerId = this.auth.currentUser?.id;
    if (!managerId) { this.error = 'Not logged in.'; return; }

    this.saving = true;
    this.error = '';

    const body = {
      ...this.form.value,
      managerId,                                        // ← was missing, caused managerId: 0 in DB
      openTime: this.form.value.openTime + ':00',
      closeTime: this.form.value.closeTime + ':00'
    };

    this.lots$.create(body).subscribe({
      next: created => {
        this.saving = false;
        this.close();
        if (created && (created as ParkingLot).id) {
          this.lots = [created as ParkingLot, ...this.lots];
        } else {
          this.load();
        }
        this.toast.success(
          'Lot submitted',
          'It is pending admin approval. You will see it here once approved.'
        );
      },
      error: err => {
        this.saving = false;
        this.error = err.error?.message || 'Could not create the lot.';
      }
    });
  }

  toggleOpen(lot: ParkingLot): void {
    this.lots$.setOpen(lot.id, !lot.isOpen).subscribe({
      next: updated => {
        Object.assign(lot, updated);
        this.toast.info(updated.isOpen ? 'Lot opened' : 'Lot closed', lot.name);
      },
      error: () => this.toast.error('Could not update lot status')
    });
  }

  goToLot(id: number): void { this.router.navigate(['/manager/lots', id]); }
  goToAnalytics(id: number): void { this.router.navigate(['/manager/analytics', id]); }
}

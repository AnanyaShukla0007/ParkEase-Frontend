import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import {
  Vehicle, VehicleTypeEnum, VehicleTypeLabel
} from '../../../core/models/api-models';

@Component({
  selector: 'app-my-vehicles',
  templateUrl: './my-vehicles.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './my-vehicles.component.scss']
})
export class MyVehiclesComponent implements OnInit {
  vehicles: Vehicle[] = [];
  loading = true;
  showForm = false;
  form: FormGroup;
  saving = false;
  error = '';

  readonly VehicleTypeEnum = VehicleTypeEnum;
  readonly typeLabel = VehicleTypeLabel;
  readonly types: VehicleTypeEnum[] = [
    VehicleTypeEnum.TwoWheeler,
    VehicleTypeEnum.FourWheeler,
    VehicleTypeEnum.Heavy
  ];

  constructor(
    private fb: FormBuilder,
    private vehicles$: VehicleService,
    private auth: AuthService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {
    this.form = this.fb.group({
      licensePlate: ['', [Validators.required, Validators.maxLength(20)]],
      make: ['', Validators.required],
      model: ['', Validators.required],
      color: ['', Validators.required],
      vehicleType: [VehicleTypeEnum.FourWheeler, Validators.required],
      isEV: [false]
    });
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;
    this.loading = true;
    this.vehicles$.getByOwner(userId).subscribe({
      next: list => { this.vehicles = Array.isArray(list) ? list : []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  open(): void {
    this.showForm = true;
    this.error = '';
    this.form.reset({ vehicleType: VehicleTypeEnum.FourWheeler, isEV: false });
  }
  close(): void { this.showForm = false; }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const userId = this.auth.currentUser?.id;
    if (!userId) return;

    const formValue = this.form.value;
    const licensePlate = this.normalizePlate(formValue.licensePlate);
    this.form.patchValue({ licensePlate }, { emitEvent: false });

    this.saving = true;
    this.error = '';
    this.vehicles$.register({
      ownerId: userId,
      licensePlate,
      make: (formValue.make || '').trim(),
      model: (formValue.model || '').trim(),
      color: (formValue.color || '').trim(),
      vehicleType: Number(formValue.vehicleType),
      isEV: !!formValue.isEV,
      isActive: true
    }).subscribe({
      next: created => {
        this.saving = false;
        this.close();
        // Push the new vehicle into the local list immediately so the
        // user sees it without waiting for a reload round-trip.
        if (created && (created as Vehicle).vehicleId) {
          this.vehicles = [created as Vehicle, ...this.vehicles];
        } else {
          this.load();
        }
        this.toast.success('Vehicle registered', `${licensePlate} added to your garage.`);
      },
      error: err => {
        this.saving = false;
        this.error = this.vehicleError(err);
      }
    });
  }

  private normalizePlate(value: string): string {
    return (value || '').replace(/[\s-]/g, '').toUpperCase().trim();
  }

  private vehicleError(err: any): string {
    const backendMessage = err?.error?.message || err?.error?.title;
    const validationErrors = err?.error?.errors
      ? Object.values(err.error.errors).flat().join(' ')
      : '';

    if (backendMessage) return backendMessage;
    if (validationErrors) return validationErrors;
    if (err?.status === 0) return 'Vehicle service is not reachable. Make sure the backend gateway is running.';
    if (err?.status === 401 || err?.status === 403) return 'Your session cannot register vehicles. Sign out and sign in again as a driver.';
    if (err?.status === 409) return 'That plate is already registered.';
    if (err?.status === 400) return 'Vehicle details were rejected. Check the fields and try again.';

    return `Could not register vehicle${err?.status ? ` (HTTP ${err.status})` : ''}.`;
  }

  async remove(v: Vehicle): Promise<void> {
    const res = await this.confirm.ask({
      title: 'Remove this vehicle?',
      message: `${v.licensePlate} (${v.make} ${v.model}) will be removed from your garage. Active bookings on this vehicle won't be affected.`,
      confirmLabel: 'Remove',
      danger: true
    });
    if (!res.confirmed) return;
    this.vehicles$.delete(v.vehicleId).subscribe({
      next: () => {
        this.vehicles = this.vehicles.filter(x => x.vehicleId !== v.vehicleId);
        this.toast.success('Vehicle removed', `${v.licensePlate} is gone.`);
      },
      error: () => this.toast.error('Could not remove vehicle')
    });
  }
}

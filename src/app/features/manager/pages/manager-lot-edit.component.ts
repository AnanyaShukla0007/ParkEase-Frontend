import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { SpotService } from '../../../core/services/api.services';
import {
  ParkingLot, ParkingSpot, SpotType, SpotStatus, SpotTypeLabel,
  VehicleTypeEnum, VehicleTypeLabel
} from '../../../core/models/api-models';
import { forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-manager-lot-edit',
  templateUrl: './manager-lot-edit.component.html',
  styleUrls: [
    '../../../shared/dashboard-shared.scss',
    '../../driver/pages/lot-detail.component.scss',
    './manager-lot-edit.component.scss'
  ]
})
export class ManagerLotEditComponent implements OnInit {
  lotId = 0;
  lot?: ParkingLot;
  spots: ParkingSpot[] = [];
  loading = true;

  showBulkForm = false;
  bulkForm: FormGroup;
  bulkSaving = false;
  bulkError = '';

  readonly SpotStatus = SpotStatus;
  readonly SpotType = SpotType;
  readonly typeLabel = SpotTypeLabel;
  readonly vehicleTypeLabel = VehicleTypeLabel;
  readonly spotTypes: SpotType[] = [
    SpotType.Compact, SpotType.Standard, SpotType.Large, SpotType.Motorbike, SpotType.EV
  ];
  readonly vehicleTypes: VehicleTypeEnum[] = [
    VehicleTypeEnum.TwoWheeler, VehicleTypeEnum.FourWheeler, VehicleTypeEnum.Heavy
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private lots$: ParkingLotService,
    private spots$: SpotService
  ) {
    this.bulkForm = this.fb.group({
      count: [10, [Validators.required, Validators.min(1), Validators.max(200)]],
      startNumber: [1, [Validators.required, Validators.min(1)]],
      floor: [0, [Validators.required, Validators.min(0)]],
      spotType: [SpotType.Standard, Validators.required],
      vehicleType: [VehicleTypeEnum.FourWheeler, Validators.required],
      isHandicapped: [false],
      isEVCharging: [false],
      pricePerHour: [20, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.lotId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.lotId) { this.router.navigate(['/manager/lots']); return; }
    this.load();
  }

  private load(): void {
    this.loading = true;
    forkJoin({
      lot: this.lots$.getById(this.lotId).pipe(catchError(() => of(null as any))),
      spots: this.spots$.getByLot(this.lotId).pipe(catchError(() => of([] as ParkingSpot[])))
    }).subscribe(res => {
      this.lot = res.lot;
      this.spots = res.spots || [];
      this.loading = false;
    });
  }

  get floors(): number[] {
    return [...new Set(this.spots.map(s => s.floor))].sort((a, b) => a - b);
  }
  spotsFor(floor: number): ParkingSpot[] {
    return this.spots.filter(s => s.floor === floor);
  }

  openBulk(): void {
    const maxNumber = Math.max(0, ...this.spots.map(s => parseInt(s.spotNumber, 10) || 0));
    this.bulkForm.patchValue({ startNumber: maxNumber + 1 });
    this.showBulkForm = true;
    this.bulkError = '';
  }
  closeBulk(): void { this.showBulkForm = false; }

  saveBulk(): void {
    if (this.bulkForm.invalid) { this.bulkForm.markAllAsTouched(); return; }
    this.bulkSaving = true;
    this.bulkError = '';
    this.spots$.bulkCreate({ lotId: this.lotId, ...this.bulkForm.value }).subscribe({
      next: () => { this.bulkSaving = false; this.closeBulk(); this.load(); },
      error: err => { this.bulkSaving = false; this.bulkError = err.error?.message || 'Bulk create failed.'; }
    });
  }

  releaseSpot(s: ParkingSpot): void {
    if (!confirm(`Release spot #${s.spotNumber}? Any active reservation will be forcibly ended.`)) return;
    this.spots$.release(s.spotId).subscribe(updated => Object.assign(s, updated));
  }

  deleteSpot(s: ParkingSpot): void {
    if (!confirm(`Delete spot #${s.spotNumber}? This cannot be undone.`)) return;
    this.spots$.delete(s.spotId).subscribe(() => this.load());
  }

  get available(): number { return this.spots.filter(s => s.status === SpotStatus.Available).length; }
  get reserved(): number { return this.spots.filter(s => s.status === SpotStatus.Reserved).length; }
  get occupied(): number { return this.spots.filter(s => s.status === SpotStatus.Occupied).length; }
}

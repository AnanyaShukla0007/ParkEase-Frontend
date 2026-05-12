import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { DriverShellComponent } from './driver-shell.component';
import { DriverDashboardComponent } from './pages/driver-dashboard.component';
import { NearbyLotsComponent } from './pages/nearby-lots.component';
import { LotDetailComponent } from './pages/lot-detail.component';
import { MyBookingsComponent } from './pages/my-bookings.component';
import { MyVehiclesComponent } from './pages/my-vehicles.component';
import { MyPaymentsComponent } from './pages/my-payments.component';
import { MyNotificationsComponent } from './pages/my-notifications.component';
import { DriverScanComponent } from './pages/driver-scan.component';
import { roleGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: DriverShellComponent,
    children: [
      { path: '', component: DriverDashboardComponent, canActivate: [roleGuard(['DRIVER'])] },
      { path: 'nearby', component: NearbyLotsComponent },
      { path: 'lots/:id', component: LotDetailComponent },
      { path: 'bookings', component: MyBookingsComponent, canActivate: [roleGuard(['DRIVER'])] },
      { path: 'vehicles', component: MyVehiclesComponent, canActivate: [roleGuard(['DRIVER'])] },
      { path: 'payments', component: MyPaymentsComponent, canActivate: [roleGuard(['DRIVER'])] },
      { path: 'notifications', component: MyNotificationsComponent, canActivate: [roleGuard(['DRIVER'])] },
      { path: 'scan', component: DriverScanComponent, canActivate: [roleGuard(['DRIVER'])] }
    ]
  }
];

@NgModule({
  declarations: [
    DriverShellComponent,
    DriverDashboardComponent,
    NearbyLotsComponent,
    LotDetailComponent,
    MyBookingsComponent,
    MyVehiclesComponent,
    MyPaymentsComponent,
    MyNotificationsComponent,
    DriverScanComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class DriverModule {}

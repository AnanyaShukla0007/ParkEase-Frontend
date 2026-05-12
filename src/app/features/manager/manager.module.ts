import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { ManagerShellComponent } from './manager-shell.component';
import { ManagerDashboardComponent } from './pages/manager-dashboard.component';
import { ManagerLotsComponent } from './pages/manager-lots.component';
import { ManagerLotEditComponent } from './pages/manager-lot-edit.component';
import { ManagerAnalyticsComponent } from './pages/manager-analytics.component';
import { ManagerBookingsComponent } from './pages/manager-bookings.component';
import { ManagerNotificationsComponent } from './pages/manager-notifications.component';

const routes: Routes = [
  {
    path: '',
    component: ManagerShellComponent,
    children: [
      { path: '', component: ManagerDashboardComponent },
      { path: 'lots', component: ManagerLotsComponent },
      { path: 'lots/:id', component: ManagerLotEditComponent },
      { path: 'analytics/:id', component: ManagerAnalyticsComponent },
      { path: 'bookings', component: ManagerBookingsComponent },
      { path: 'notifications', component: ManagerNotificationsComponent }
    ]
  }
];

@NgModule({
  declarations: [
    ManagerShellComponent,
    ManagerDashboardComponent,
    ManagerLotsComponent,
    ManagerLotEditComponent,
    ManagerAnalyticsComponent,
    ManagerBookingsComponent,
    ManagerNotificationsComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class ManagerModule {}

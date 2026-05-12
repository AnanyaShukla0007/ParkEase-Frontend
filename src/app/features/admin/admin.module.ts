import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { AdminShellComponent } from './admin-shell.component';
import { AdminDashboardComponent } from './pages/admin-dashboard.component';
import { AdminLotsComponent } from './pages/admin-lots.component';
import { AdminUsersComponent } from './pages/admin-users.component';
import { AdminBookingsComponent } from './pages/admin-bookings.component';
import { AdminAnalyticsComponent } from './pages/admin-analytics.component';
import { AdminNotificationsComponent } from './pages/admin-notifications.component';
import { AdminManagerApplicationsComponent } from './pages/admin-manager-applications.component';
import { AdminAuditComponent } from './pages/admin-audit.component';

const routes: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'lots', component: AdminLotsComponent },
      { path: 'manager-applications', component: AdminManagerApplicationsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'bookings', component: AdminBookingsComponent },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'notifications', component: AdminNotificationsComponent },
      { path: 'audit', component: AdminAuditComponent }
    ]
  }
];

@NgModule({
  declarations: [
    AdminShellComponent,
    AdminDashboardComponent,
    AdminLotsComponent,
    AdminManagerApplicationsComponent,
    AdminUsersComponent,
    AdminBookingsComponent,
    AdminAnalyticsComponent,
    AdminNotificationsComponent,
    AdminAuditComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class AdminModule {}

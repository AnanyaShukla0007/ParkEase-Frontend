import { Component } from '@angular/core';
import { NavLink } from '../../shared/components/dash-nav.component';
import { DeviceService } from '../../core/services/device.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-driver-shell',
  template: `
    <div class="dash-page">
      <app-dash-nav [links]="visibleLinks" brandTag="DRIVER"></app-dash-nav>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['../../shared/dashboard-shared.scss']
})
export class DriverShellComponent {
  constructor(public device: DeviceService, public auth: AuthService) {}

  private readonly allLinks: (NavLink & { mobileOnly?: boolean })[] = [
    { label: 'Overview', path: '/driver', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>' },
    { label: 'Nearby', path: '/driver/nearby', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 18c3-4 6-7.5 6-11a6 6 0 10-12 0c0 3.5 3 7 6 11z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="7" r="2" fill="currentColor"/></svg>' },
    { label: 'Scan pass', path: '/driver/scan', mobileOnly: true, icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="5" height="5" stroke="currentColor" stroke-width="1.5"/><rect x="12" y="3" width="5" height="5" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="12" width="5" height="5" stroke="currentColor" stroke-width="1.5"/><rect x="12" y="12" width="2" height="2" fill="currentColor"/><rect x="15" y="12" width="2" height="2" fill="currentColor"/><rect x="12" y="15" width="2" height="2" fill="currentColor"/><rect x="15" y="15" width="2" height="2" fill="currentColor"/></svg>' },
    { label: 'Bookings', path: '/driver/bookings', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { label: 'Vehicles', path: '/driver/vehicles', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M2 13h1c.5-2 2-4 3.5-4.5L9 8h4l2.5.5C17 9 18.5 11 19 13h1M3 13h14v3H3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="6" cy="16" r="1.5" fill="currentColor"/><circle cx="14" cy="16" r="1.5" fill="currentColor"/></svg>' },
    { label: 'Payments', path: '/driver/payments', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M2 9h16" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="12" width="4" height="1.5" rx=".5" fill="currentColor"/></svg>' },
    { label: 'Alerts', path: '/driver/notifications', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke="currentColor" stroke-width="1.5"/><path d="M8 15.5a2 2 0 004 0" stroke="currentColor" stroke-width="1.5"/></svg>' }
  ];

  get visibleLinks(): NavLink[] {
    return this.allLinks.filter(l =>
      (!l.mobileOnly || this.device.isMobile) &&
      (this.auth.isLoggedIn || l.path === '/driver/nearby')
    );
  }
}

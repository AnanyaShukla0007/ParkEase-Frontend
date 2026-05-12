import { Component } from '@angular/core';
import { NavLink } from '../../shared/components/dash-nav.component';

@Component({
  selector: 'app-admin-shell',
  template: `
    <div class="dash-page">
      <app-dash-nav [links]="links" brandTag="ADMIN"></app-dash-nav>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['../../shared/dashboard-shared.scss']
})
export class AdminShellComponent {
  links: NavLink[] = [
    { label: 'Platform', path: '/admin', icon: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M2 10h16M10 2c2.5 3 2.5 13 0 16M10 2c-2.5 3-2.5 13 0 16" stroke="currentColor" stroke-width="1.5"/></svg>' },
    { label: 'Lot approvals', path: '/admin/lots', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 10l3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>' },
    { label: 'Mgr. apps', path: '/admin/manager-applications', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 3h7l4 4v10H5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 3v4h4M8 12h6M8 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { label: 'Users', path: '/admin/users', icon: '<svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 17c.5-3 2.5-5 5-5s4.5 2 5 5M12 16c.3-2 1.5-3 3-3s2.7 1 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { label: 'Bookings', path: '/admin/bookings', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { label: 'Analytics', path: '/admin/analytics', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 4 3 3-5 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { label: 'Broadcast', path: '/admin/notifications', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 13V7l6-4 6 4v6l-6 4-6-4z" stroke="currentColor" stroke-width="1.5"/><path d="M10 3v14M4 7l6 4 6-4" stroke="currentColor" stroke-width="1.5"/></svg>' },
    { label: 'Audit', path: '/admin/audit', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 2h10v16H5z" stroke="currentColor" stroke-width="1.5"/><path d="M8 6h4M8 10h4M8 14h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' }
  ];
}

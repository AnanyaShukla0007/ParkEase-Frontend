import { Component } from '@angular/core';
import { NavLink } from '../../shared/components/dash-nav.component';

@Component({
  selector: 'app-manager-shell',
  template: `
    <div class="dash-page">
      <app-dash-nav [links]="links" brandTag="LOT MANAGER"></app-dash-nav>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['../../shared/dashboard-shared.scss']
})
export class ManagerShellComponent {
  links: NavLink[] = [
    { label: 'Overview', path: '/manager', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M2 8h16M8 2v16" stroke="currentColor" stroke-width="1.5"/></svg>' },
    { label: 'My lots', path: '/manager/lots', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="7" width="3" height="4" fill="currentColor"/><rect x="9" y="7" width="3" height="4" fill="currentColor" opacity=".5"/><rect x="13" y="7" width="3" height="4" fill="currentColor"/></svg>' },
    { label: 'Bookings', path: '/manager/bookings', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { label: 'Alerts', path: '/manager/notifications', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke="currentColor" stroke-width="1.5"/><path d="M8 15.5a2 2 0 004 0" stroke="currentColor" stroke-width="1.5"/></svg>' }
  ];
}

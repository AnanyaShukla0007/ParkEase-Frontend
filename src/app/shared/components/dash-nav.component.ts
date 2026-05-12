import { Component, Input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

export interface NavLink { label: string; path: string; icon: string; }

@Component({
  selector: 'app-dash-nav',
  templateUrl: './dash-nav.component.html',
  styleUrls: ['./dash-nav.component.scss']
})
export class DashNavComponent {
  @Input() links: NavLink[] = [];
  @Input() brandTag = 'DASHBOARD';
  passwordMessage = '';
  passwordError = '';

  constructor(public auth: AuthService, private router: Router) {}

  changePassword(): void {
    this.passwordMessage = '';
    this.passwordError = '';

    const currentPassword = prompt('Current password');
    if (!currentPassword) return;

    const newPassword = prompt('New password (minimum 8 characters)');
    if (!newPassword) return;

    if (newPassword.length < 8) {
      this.passwordError = 'New password must be at least 8 characters.';
      return;
    }

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordMessage = 'Password changed successfully.';
        setTimeout(() => this.passwordMessage = '', 4000);
      },
      error: err => {
        this.passwordError = err?.error?.message || 'Could not change password. Check your current password.';
        setTimeout(() => this.passwordError = '', 6000);
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}

import { Component, OnInit } from '@angular/core';
import { AdminUserService } from '../../../core/services/api.services';
import { User, UserRole } from '../../../core/models/api-models';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  roleFilter: UserRole | 'ALL' = 'ALL';
  search = '';
  actionId: number | null = null;
  error = '';

  constructor(private users$: AdminUserService) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.users$.getAllUsers().subscribe({
      next: list => { this.users = list; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): User[] {
    const q = this.search.trim().toLowerCase();
    return this.users.filter(u =>
      (this.roleFilter === 'ALL' || u.role === this.roleFilter) &&
      (q === '' ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phoneNumber.toLowerCase().includes(q))
    );
  }

  get counts() {
    return {
      total: this.users.length,
      drivers: this.users.filter(u => u.role === 'DRIVER').length,
      managers: this.users.filter(u => u.role === 'MANAGER').length,
      admins: this.users.filter(u => u.role === 'ADMIN').length,
      inactive: this.users.filter(u => !u.isActive).length
    };
  }

  suspend(user: User): void {
    if (!confirm(`Suspend ${user.fullName}? They won't be able to log in.`)) return;
    this.actionId = user.id;
    this.users$.suspend(user.id).subscribe({
      next: () => { user.isActive = false; this.actionId = null; },
      error: err => { this.actionId = null; this.error = err.error?.message || 'Suspension failed.'; }
    });
  }

  reactivate(user: User): void {
    this.actionId = user.id;
    this.users$.reactivate(user.id).subscribe({
      next: () => { user.isActive = true; this.actionId = null; },
      error: err => { this.actionId = null; this.error = err.error?.message || 'Reactivation failed.'; }
    });
  }

  delete(user: User): void {
    if (!confirm(`Permanently delete ${user.fullName}? This cannot be undone.`)) return;
    this.actionId = user.id;
    this.users$.delete(user.id).subscribe({
      next: () => { this.actionId = null; this.load(); },
      error: err => { this.actionId = null; this.error = err.error?.message || 'Delete failed.'; }
    });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
}

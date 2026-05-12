import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import {
  ManagerApplication, ApprovalCredentials
} from '../../../core/models/api-models';

@Component({
  selector: 'app-admin-manager-applications',
  templateUrl: './admin-manager-applications.component.html',
  styleUrls: [
    '../../../shared/dashboard-shared.scss',
    './admin-lots.component.scss',
    './admin-manager-applications.component.scss'
  ]
})
export class AdminManagerApplicationsComponent implements OnInit {
  apps: ManagerApplication[] = [];
  loading = true;
  filter: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING';
  actionId: number | null = null;
  // Credentials modal — shown after a successful approval
  credentials: ApprovalCredentials | null = null;

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.auth.listManagerApplications().subscribe({
      next: list => {
        this.apps = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): ManagerApplication[] {
    if (this.filter === 'ALL') return this.apps;
    return this.apps.filter(a => a.status === this.filter);
  }

  get pendingCount(): number { return this.apps.filter(a => a.status === 'PENDING').length; }

  private patch(updated: ManagerApplication): void {
    this.apps = this.apps.map(a => a.id === updated.id ? { ...a, ...updated } : a);
  }

  async approve(app: ManagerApplication): Promise<void> {
    const res = await this.confirm.ask({
      title: 'Approve manager application?',
      message: `${app.fullName} will receive credentials tied to a parking lot. Confirm the lot name below — it will be used to generate the username.`,
      confirmLabel: 'Approve & generate credentials',
      promptDefault: app.proposedLotName,
      promptLabel: 'Lot name (used for username)'
    });
    if (!res.confirmed) return;

    const lotName = (res.value || app.proposedLotName).trim();
    this.actionId = app.id;
    this.auth.approveManagerApplication(app.id, lotName).subscribe({
      next: creds => {
        this.actionId = null;
        this.credentials = creds;
        // Mark the app approved locally so the list updates immediately
        this.patch({
          ...app,
          status: 'APPROVED',
          approvedAt: new Date().toISOString(),
          generatedUsername: creds.username
        });
        this.toast.success(
          'Application approved',
          `Credentials generated for ${creds.username}.`
        );
      },
      error: err => {
        this.actionId = null;
        this.toast.error(
          'Approval failed',
          err.error?.message || 'Could not approve. Please try again.'
        );
      }
    });
  }

  async reject(app: ManagerApplication): Promise<void> {
    const res = await this.confirm.ask({
      title: 'Reject this application?',
      message: `${app.fullName}'s application for "${app.proposedLotName}" will be rejected.`,
      confirmLabel: 'Reject',
      danger: true,
      promptDefault: '',
      promptLabel: 'Reason (optional, will be emailed to applicant)'
    });
    if (!res.confirmed) return;

    this.actionId = app.id;
    this.auth.rejectManagerApplication(app.id, res.value || '').subscribe({
      next: () => {
        this.actionId = null;
        this.patch({ ...app, status: 'REJECTED', rejectReason: res.value || '' });
        this.toast.warning('Application rejected', app.fullName);
      },
      error: err => {
        this.actionId = null;
        this.toast.error('Rejection failed', err.error?.message || '');
      }
    });
  }

  closeCredentials(): void { this.credentials = null; }

  copyCredentials(): void {
    if (!this.credentials) return;
    const text = `Username: ${this.credentials.username}\nPassword: ${this.credentials.password}\nEmail: ${this.credentials.email}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => this.toast.success('Copied to clipboard'),
        () => this.toast.error('Could not copy')
      );
    }
  }

  statusClass(s: string): string {
    return s === 'APPROVED' ? 'lime'
      : s === 'REJECTED' ? 'rose'
      : 'amber';
  }
}

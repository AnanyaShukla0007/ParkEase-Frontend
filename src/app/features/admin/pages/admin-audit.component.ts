import { Component, OnInit } from '@angular/core';
import { AdminUserService } from '../../../core/services/api.services';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-audit',
  templateUrl: './admin-audit.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './admin-audit.component.scss']
})
export class AdminAuditComponent implements OnInit {
  logs: any[] = [];
  loading = true;

  constructor(private users$: AdminUserService) {}

  ngOnInit(): void {
    this.users$.auditLogs().pipe(catchError(() => of([]))).subscribe(logs => {
      this.logs = logs || [];
      this.loading = false;
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  NotificationService,
  AdminUserService
} from '../../../core/services/api.services';
import { User } from '../../../core/models/api-models';

@Component({
  selector: 'app-admin-notifications',
  templateUrl: './admin-notifications.component.html',
  styleUrls: [
    '../../../shared/dashboard-shared.scss',
    './admin-notifications.component.scss'
  ]
})
export class AdminNotificationsComponent implements OnInit {
  form: FormGroup;
  users: User[] = [];

  sending = false;
  success = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private notif$: NotificationService,
    private users$: AdminUserService
  ) {
    this.form = this.fb.group({
      targetGroup: ['ALL', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(120)]],
      message: ['', [Validators.required, Validators.maxLength(500)]],
      channel: ['APP', Validators.required]
    });
  }

  ngOnInit(): void {
    this.users$.getAllUsers().subscribe({
      next: res => this.users = Array.isArray(res) ? res : [],
      error: () => this.users = []
    });
  }

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;
    this.success = '';
    this.error = '';

    const { targetGroup, title, message, channel } = this.form.value;

    const channelMap: Record<string, string> = {
      APP: '1',
      EMAIL: '2',
      SMS: '3'
    };

    let recipients: number[] = [];

    if (targetGroup === 'ALL') {
      recipients = this.users
        .filter(u => u.role === 'DRIVER' || u.role === 'MANAGER')
        .map(u => u.id);
    }

    if (targetGroup === 'DRIVER') {
      recipients = this.users
        .filter(u => u.role === 'DRIVER')
        .map(u => u.id);
    }

    if (targetGroup === 'MANAGER') {
      recipients = this.users
        .filter(u => u.role === 'MANAGER')
        .map(u => u.id);
    }

    if (!recipients.length) {
      this.sending = false;
      this.error = `No recipients found for ${targetGroup}.`;
      return;
    }

    this.notif$
      .sendBulk(recipients, title, message, channelMap[channel])
      .subscribe({
        next: () => {
          this.sending = false;
          this.success = `Notification sent to ${targetGroup}.`;
          this.form.reset({
            targetGroup: 'ALL',
            channel: 'APP',
            title: '',
            message: ''
          });
        },
        error: err => {
          this.sending = false;
          this.error =
            err.error?.message ||
            'Broadcast failed. Check notification service.';
        }
      });
  }
}

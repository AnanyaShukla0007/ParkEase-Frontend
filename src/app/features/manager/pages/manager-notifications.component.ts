import { Component, OnInit } from '@angular/core';
import { Notification } from '../../../core/models/api-models';
import { NotificationService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-manager-notifications',
  templateUrl: './manager-notifications.component.html',
  styleUrls: [
    '../../../shared/dashboard-shared.scss',
    './manager-notifications.component.scss'
  ]
})
export class ManagerNotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  markingAll = false;

  constructor(private notif$: NotificationService, private auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    const uid = this.auth.currentUser?.id;
    if (!uid) return;

    this.loading = true;
    this.notif$.getByRecipient(uid).subscribe({
      next: list => {
        this.notifications = (Array.isArray(list) ? list : [])
          .map(n => ({
            ...n,
            title: n.title?.trim() || 'Manager alert',
            message: n.message?.trim() || 'No message details were provided.',
            type: this.displayType(n.type),
            channel: n.channel || 'App',
            sentAt: n.sentAt || new Date().toISOString()
          }))
          .sort((a, b) => +new Date(b.sentAt) - +new Date(a.sentAt));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get unreadCount(): number { return this.notifications.filter(n => !n.isRead).length; }

  markRead(n: Notification): void {
    if (n.isRead) return;
    this.notif$.markRead(n.id).subscribe({ next: () => n.isRead = true });
  }

  markAllRead(): void {
    const uid = this.auth.currentUser?.id;
    if (!uid) return;

    this.markingAll = true;
    this.notif$.markAllRead(uid).subscribe({
      next: () => { this.notifications.forEach(n => n.isRead = true); this.markingAll = false; },
      error: () => { this.markingAll = false; }
    });
  }

  displayType(type: string): string {
    const value = String(type || '').trim();
    const numeric: Record<string, string> = {
      '1': 'Booking',
      '2': 'CheckIn',
      '3': 'CheckOut',
      '4': 'Expiry',
      '5': 'Payment',
      '6': 'Promo'
    };

    return numeric[value] || value || 'Alert';
  }

  typeIcon(type: string): string {
    switch (this.displayType(type).toUpperCase()) {
      case 'BOOKING': return 'BK';
      case 'CHECKIN': return 'IN';
      case 'CHECKOUT': return 'OUT';
      case 'EXPIRY': return '!';
      case 'PAYMENT': return 'Rs';
      default: return 'i';
    }
  }
}

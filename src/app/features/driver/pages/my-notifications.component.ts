import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { Notification } from '../../../core/models/api-models';

@Component({
  selector: 'app-my-notifications',
  templateUrl: './my-notifications.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './my-notifications.component.scss']
})
export class MyNotificationsComponent implements OnInit {
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
            title: this.displayTitle(n),
            message: this.displayMessage(n),
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

  displayTitle(n: Notification): string {
    return n.title?.trim() || `${this.displayType(n.type)} alert`;
  }

  displayMessage(n: Notification): string {
    return n.message?.trim() || 'No message details were provided by the notification service.';
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
      case 'BOOKING': return 'B';
      case 'CHECKIN': return 'IN';
      case 'CHECKOUT': return 'OUT';
      case 'EXPIRY': return '!';
      case 'PAYMENT': return 'Rs';
      case 'PROMO': return '%';
      default: return 'i';
    }
  }

  typeClass(type: string): string {
    switch (this.displayType(type).toUpperCase()) {
      case 'BOOKING': return 'amber';
      case 'CHECKIN': return 'cyan';
      case 'CHECKOUT': return 'lime';
      case 'EXPIRY': return 'rose';
      case 'PAYMENT': return 'lime';
      default: return '';
    }
  }
}

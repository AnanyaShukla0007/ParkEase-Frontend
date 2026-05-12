import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { Payment, PaymentMethod, PaymentStatus } from '../../../core/models/api-models';

@Component({
  selector: 'app-my-payments',
  templateUrl: './my-payments.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './my-payments.component.scss']
})
export class MyPaymentsComponent implements OnInit {
  payments: Payment[] = [];
  loading = true;
  filter: 'ALL' | 'PAID' | 'REFUNDED' | 'PENDING' = 'ALL';
  error = '';
  selectedReceipt: Payment | null = null;

  readonly PaymentStatus = PaymentStatus;

  constructor(
    private pay$: PaymentService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const uid = this.auth.currentUser?.id;
    if (!uid) return;

    this.loading = true;

    this.pay$.getByUser(uid).subscribe({
      next: list => {
        this.payments = list.sort(
          (a, b) => this.paymentDateMs(b) - this.paymentDateMs(a)
        );

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filtered(): Payment[] {
    if (this.filter === 'ALL') return this.payments;

    return this.payments.filter(
      p => this.statusName(p).toUpperCase() === this.filter
    );
  }

  get totalPaid(): number {
    return this.payments
      .filter(p => p.status === PaymentStatus.Paid)
      .reduce((s, p) => s + p.amount, 0);
  }

  get totalRefunded(): number {
    return this.payments
      .filter(p => p.status === PaymentStatus.Refunded)
      .reduce((s, p) => s + p.amount, 0);
  }

  statusClass(p: Payment): string {
    switch (p.status) {
      case PaymentStatus.Paid:
        return 'lime';
      case PaymentStatus.Refunded:
        return 'cyan';
      case PaymentStatus.Failed:
        return 'rose';
      default:
        return 'amber';
    }
  }

  statusName(p: Payment): string {
    switch (p.status) {
      case PaymentStatus.Paid:
        return 'Paid';
      case PaymentStatus.Failed:
        return 'Failed';
      case PaymentStatus.Refunded:
        return 'Refunded';
      default:
        return 'Pending';
    }
  }

  methodName(p: Payment): string {
    if (p.paymentMethod) {
      switch (p.paymentMethod) {
        case PaymentMethod.Card:
          return 'Card';
        case PaymentMethod.Upi:
          return 'UPI';
        case PaymentMethod.Wallet:
          return 'Wallet';
        case PaymentMethod.NetBanking:
          return 'Net banking';
        case PaymentMethod.Cash:
          return 'Cash';
      }
    }

    return p.mode || 'Payment';
  }

  paidAt(p: Payment): string | null {
    return p.paidAtUtc || p.paidAt || p.createdAtUtc || null;
  }

  transactionRef(p: Payment): string | null {
    return p.transactionReference || p.transactionId || p.providerReference || null;
  }

  description(p: Payment): string {
    const source = p.description || p.notes || '';
    const cleaned = source
      .replace(/mock\s+/ig, '')
      .replace(/mock/ig, '')
      .replace(/Saga:\s*[^.|]+\.?/ig, '')
      .replace(/\s*\|\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return cleaned || `Parking fee - Booking #${p.bookingId}`;
  }

  isPaid(p: Payment): boolean {
    return p.status === PaymentStatus.Paid;
  }

  viewReceipt(p: Payment): void {
    this.selectedReceipt = p;
  }

  closeReceipt(): void {
    this.selectedReceipt = null;
  }

  printReceipt(): void {
    setTimeout(() => window.print(), 200);
  }

  requestRefund(p: Payment): void {
    if (!confirm('Request a refund for this payment?')) return;

    const reason = prompt('Refund reason (optional):') ?? '';
    this.error = '';

    this.pay$.refund(p.id, reason).subscribe({
      next: updated => Object.assign(p, updated),
      error: err => {
        this.error =
          err.error?.message || 'Refund request failed.';
      }
    });
  }

  private paymentDateMs(p: Payment): number {
    return +new Date(this.paidAt(p) || 0);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  ParkingSpot,
  CreateSpotRequest,
  BulkCreateSpotRequest,
  Vehicle,
  CreateVehicleRequest,
  Booking,
  CreateBookingRequest,
  CheckoutReceipt,
  Payment,
  PaymentMethod,
  MockRazorpayOrderResponse,
  MockRazorpayConfirmRequest,
  PaymentSagaResponse,
  Notification,
  PlatformSummary,
  User
} from '../models/api-models';

const unwrap = <T>(res: any): T => res?.data ?? res;

@Injectable({ providedIn: 'root' })
export class SpotService {
  private readonly base = `${environment.apiUrl}/spots`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ParkingSpot[]> {
    return this.http.get<any>(this.base).pipe(map(r => unwrap<ParkingSpot[]>(r)));
  }

  getById(id: number): Observable<ParkingSpot> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => unwrap<ParkingSpot>(r)));
  }

  getByLot(lotId: number): Observable<ParkingSpot[]> {
    return this.http.get<any>(`${this.base}/lot/${lotId}`).pipe(map(r => unwrap<ParkingSpot[]>(r)));
  }

  getAvailable(lotId: number): Observable<ParkingSpot[]> {
    return this.http.get<any>(`${this.base}/lot/${lotId}/available`).pipe(map(r => unwrap<ParkingSpot[]>(r)));
  }

  count(lotId: number): Observable<{ total: number; available: number }> {
    return this.http.get<{ total: number; available: number }>(`${this.base}/lot/${lotId}/count`);
  }

  create(body: CreateSpotRequest): Observable<ParkingSpot> {
    return this.http.post<any>(this.base, body).pipe(map(r => unwrap<ParkingSpot>(r)));
  }

  bulkCreate(body: BulkCreateSpotRequest): Observable<ParkingSpot[]> {
    return this.http.post<any>(`${this.base}/bulk`, body).pipe(map(r => unwrap<ParkingSpot[]>(r)));
  }

  reserve(id: number): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}/reserve`, {});
  }

  occupy(id: number): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}/occupy`, {});
  }

  release(id: number): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}/release`, {});
  }

  update(id: number, body: Partial<CreateSpotRequest>): Observable<ParkingSpot> {
    return this.http.put<any>(`${this.base}/${id}`, body).pipe(map(r => unwrap<ParkingSpot>(r)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly base = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  register(body: CreateVehicleRequest): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.base, body);
  }

  getById(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.base}/${id}`);
  }

  getByOwner(ownerId: number): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.base}/owner/${ownerId}`);
  }

  getByPlate(plate: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.base}/plate/${encodeURIComponent(plate)}`);
  }

  update(id: number, body: Partial<CreateVehicleRequest>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly base = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  create(body: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.base, body);
  }

  getById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.base}/${id}`);
  }

  getByUser(userId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/user/${userId}`);
  }

  getByLot(lotId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/lot/${lotId}`);
  }

  getAll(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/all`);
  }

  cancel(id: number, reason: string): Observable<Booking> {
    return this.http
      .put<unknown>(`${this.base}/${id}/cancel`, { reason })
      .pipe(switchMap(() => this.getById(id)));
  }

  checkIn(id: number): Observable<Booking> {
    return this.http
      .put<unknown>(`${this.base}/${id}/checkin`, {})
      .pipe(switchMap(() => this.getById(id)));
  }

  checkOut(id: number, finalAmount?: number): Observable<CheckoutReceipt> {
    const body = finalAmount && finalAmount > 0 ? { finalAmount } : {};
    return this.http.put<CheckoutReceipt>(`${this.base}/${id}/checkout`, body);
  }

  extend(id: number, body: {
    newStartTimeUtc?: string;
    newEndTimeUtc: string;
    newSpotId?: number;
  }): Observable<Booking> {
    return this.http
      .put<unknown>(`${this.base}/${id}/extend`, body)
      .pipe(switchMap(() => this.getById(id)));
  }

  farePreview(id: number): Observable<{
    estimatedAmount: number;
    finalAmount: number;
    lateFee?: number;
    billableHours?: number;
  }> {
    return this.http.get<{
      estimatedAmount: number;
      finalAmount: number;
      lateFee?: number;
      billableHours?: number;
    }>(
      `${this.base}/${id}/fare-preview`
    );
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly base = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  create(body: {
    bookingId: number;
    userId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    currency?: string;
    notes?: string;
  }): Observable<Payment> {
    return this.http.post<Payment>(this.base, body);
  }

  createMockRazorpayOrder(body: {
    bookingId: number;
    userId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    currency?: string;
    notes?: string;
  }): Observable<MockRazorpayOrderResponse> {
    return this.http.post<MockRazorpayOrderResponse>(
      `${this.base}/razorpay/mock/orders`,
      body
    );
  }

  createRazorpayOrder(body: {
    bookingId: number;
    userId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    currency?: string;
    notes?: string;
  }): Observable<MockRazorpayOrderResponse> {
    return this.http.post<MockRazorpayOrderResponse>(
      `${this.base}/razorpay/create-order`,
      body
    ).pipe(
      catchError(err => {
        if (err?.status !== 404) return throwError(() => err);
        return this.create(body).pipe(map(payment => this.localOrder(payment)));
      })
    );
  }

  confirmMockRazorpayPayment(
    body: MockRazorpayConfirmRequest
  ): Observable<PaymentSagaResponse> {
    return this.http.post<PaymentSagaResponse>(
      `${this.base}/razorpay/mock/confirm`,
      body
    );
  }

  confirmRazorpayPayment(
    body: MockRazorpayConfirmRequest
  ): Observable<PaymentSagaResponse> {
    return this.http.post<PaymentSagaResponse>(
      `${this.base}/razorpay/verify`,
      body
    ).pipe(
      catchError(err => {
        if (err?.status !== 404) return throwError(() => err);
        const reference = body.razorpayPaymentId || `PE-UPI-${Date.now()}`;
        return this.process(body.paymentId, reference).pipe(
          map(payment => ({
            sagaId: `local-${payment.id}-${Date.now()}`,
            status: 'Completed',
            payment,
            providerPaymentId: reference,
            sagaSteps: [
              'Created local payment record.',
              'Processed payment through ParkEase fallback.'
            ]
          }))
        );
      })
    );
  }

  getByUser(userId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/user/${userId}`);
  }

  getByBooking(bookingId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/booking/${bookingId}`);
  }

  process(id: number, transactionId: string): Observable<Payment> {
    return this.http.put<Payment>(`${this.base}/${id}/process`, {
      transactionReference: transactionId
    });
  }

  refund(id: number, reason: string): Observable<Payment> {
    return this.http.put<Payment>(`${this.base}/${id}/refund`, { reason });
  }

  private localOrder(payment: Payment): MockRazorpayOrderResponse {
    const amount = Number(payment.amount || 0);
    const createdAtUtc = payment.createdAtUtc || new Date().toISOString();

    return {
      sagaId: `local-${payment.id}-${Date.now()}`,
      payment,
      order: {
        id: `order_local_${payment.id}`,
        entity: 'order',
        amount: Math.round(amount * 100),
        amountPaid: 0,
        amountDue: Math.round(amount * 100),
        currency: payment.currency || 'INR',
        receipt: `PE-${payment.bookingId}-${payment.id}`,
        status: 'created',
        createdAtUtc
      },
      sagaSteps: [
        'Razorpay route unavailable.',
        'Created local payment order instead.'
      ]
    };
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getByRecipient(recipientId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/recipient/${recipientId}`);
  }

  getUnread(recipientId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/recipient/${recipientId}/unread`);
  }

  getUnreadCount(recipientId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.base}/recipient/${recipientId}/unread-count`
    );
  }

  markRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/read`, {});
  }

  markAllRead(recipientId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/recipient/${recipientId}/read-all`, {});
  }

  send(
    recipientId: number,
    title: string,
    message: string,
    channel: string,
    type = '4',
    relatedId?: number,
    relatedType?: string
  ): Observable<Notification> {
    return this.http.post<Notification>(this.base, {
      recipientId,
      title,
      message,
      channel: +channel,
      type: +type,
      relatedId,
      relatedType
    });
  }

  sendBulk(
    recipientIds: number[],
    title: string,
    message: string,
    channel: string
  ): Observable<void> {
    return this.http.post<void>(`${this.base}/bulk`, {
      recipientIds,
      title,
      message,
      channel: +channel
    });
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly base = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  occupancyRate(lotId: number): Observable<{ rate: number }> {
    return this.http.get<any>(`${this.base}/occupancy-rate/${lotId}`)
      .pipe(map(value => ({ rate: typeof value === 'number' ? value : +(value?.rate ?? value?.occupancyRate ?? 0) })));
  }

  byHour(lotId: number): Observable<Record<string, number>> {
    return this.http.get<any>(`${this.base}/by-hour/${lotId}`).pipe(map(list => {
      if (!Array.isArray(list)) return list || {};
      return list.reduce((acc, item) => {
        acc[String(item.hour ?? item.Hour ?? 0)] = +(item.averageOccupancyRate ?? item.occupancyRate ?? 0);
        return acc;
      }, {} as Record<string, number>);
    }));
  }

  peakHours(lotId: number): Observable<number[]> {
    return this.http.get<any[]>(`${this.base}/peak-hours/${lotId}`)
      .pipe(map(list => (list || []).map(x => +(x.hour ?? x)).filter(x => !Number.isNaN(x))));
  }

  revenue(lotId: number, from?: Date, to?: Date): Observable<{ total: number }> {
    let p = new HttpParams();

    if (from) p = p.set('from', from.toISOString());
    if (to) p = p.set('to', to.toISOString());

    return this.http.get<any>(`${this.base}/revenue/${lotId}`, {
      params: p
    }).pipe(map(value => ({ total: +(value?.totalRevenue ?? value?.total ?? 0) })));
  }

  revenueByDay(lotId: number, from?: Date, to?: Date): Observable<Record<string, number>> {
    let p = new HttpParams();

    if (from) p = p.set('from', from.toISOString());
    if (to) p = p.set('to', to.toISOString());

    return this.http.get<any>(
      `${this.base}/revenue-by-day/${lotId}`,
      { params: p }
    ).pipe(map(list => {
      if (!Array.isArray(list)) return list || {};
      return list.reduce((acc, item) => {
        acc[String(item.day ?? item.date ?? '')] = +(item.revenue ?? 0);
        return acc;
      }, {} as Record<string, number>);
    }));
  }

  spotTypes(lotId: number): Observable<Record<string, number>> {
    return this.http.get<any>(`${this.base}/spot-types/${lotId}`).pipe(map(list => {
      if (!Array.isArray(list)) return list || {};
      return list.reduce((acc, item) => {
        acc[String(item.spotType ?? item.type ?? 'Unknown')] = +(item.count ?? item.usageCount ?? 0);
        return acc;
      }, {} as Record<string, number>);
    }));
  }

  avgDuration(lotId: number): Observable<{ minutes: number }> {
    return this.http.get<any>(`${this.base}/avg-duration/${lotId}`)
      .pipe(map(value => ({ minutes: +(value?.minutes ?? value?.averageMinutes ?? value ?? 0) })));
  }

  platformSummary(): Observable<PlatformSummary> {
    return this.http.get<PlatformSummary>(`${this.base}/platform-summary`);
  }

  trustScore(userId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/users/${userId}/trust-score`);
  }

  carbonSavings(userId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/users/${userId}/carbon-savings`);
  }

  demandHeatmap(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/demand/heatmap`);
  }

  failedHours(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/demand/failed-hours`);
  }

  dailyReport(lotId: number, date?: Date): Observable<any> {
    let p = new HttpParams();
    if (date) p = p.set('date', date.toISOString());
    return this.http.get<any>(`${this.base}/daily-report/${lotId}`, { params: p });
  }
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly base = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  getByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users/role/${role}`);
  }

  suspend(userId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/users/${userId}/suspend`, {});
  }

  reactivate(userId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/users/${userId}/reactivate`, {});
  }

  auditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/audit-logs`);
  }

  delete(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${userId}`);
  }
}

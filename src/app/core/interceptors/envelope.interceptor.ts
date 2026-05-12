import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse
} from '@angular/common/http';
import { Observable, map } from 'rxjs';

/**
 * Backend controllers (vehicle, parkinglot, spot, booking, payment,
 * notification, analytics) wrap successful responses in
 *
 *   { success: true, message?: string, data: T }
 *
 * The auth-service does NOT wrap — it returns the raw object.
 * Rather than touching every controller, this interceptor inspects
 * each response and, when it spots the envelope shape, unwraps the
 * `data` field so the frontend always sees the real payload.
 *
 * Without this, /vehicles, /parkinglots, /spots, /bookings, /payments
 * etc. would return objects shaped like { success, data } that the
 * frontend models can't read — that's why newly-created vehicles
 * and lots weren't showing up after registration.
 */
@Injectable()
export class EnvelopeInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      map(event => {
        if (event instanceof HttpResponse && this.isEnvelope(event.body)) {
          // The body has the wrapper shape — replace with .data
          const body = event.body as { success: boolean; data: unknown };
          return event.clone({ body: body.data });
        }
        return event;
      })
    );
  }

  private isEnvelope(body: unknown): boolean {
    if (!body || typeof body !== 'object') return false;
    // Must contain `success` boolean and `data` field; tolerate `message`
    if (!('success' in (body as object)) || !('data' in (body as object))) return false;
    if (typeof (body as { success: unknown }).success !== 'boolean') return false;
    return true;
  }
}

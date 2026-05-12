import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
}

/**
 * GeolocationService — thin reactive wrapper around the browser
 * Geolocation API. The case study specifies nearby-lot discovery via
 * GPS coordinates; this service provides the lat/lng pair we send to
 * GET /api/v1/parkinglots/nearby?lat=&lng=.
 *
 * No extra npm package needed — navigator.geolocation is a first-class
 * Web API. Angular has no special wrapper, we just promisify it.
 */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly _coords$ = new BehaviorSubject<Coords | null>(null);
  readonly coords$: Observable<Coords | null> = this._coords$.asObservable();

  /** Mathura default, used when the user declines permission */
  readonly fallback: Coords = { lat: 27.4924, lng: 77.6737 };

  get lastKnown(): Coords | null { return this._coords$.value; }

  /**
   * Request one-shot position. Resolves with the user's coords on
   * success, or with the fallback coordinates if permission is
   * denied / unsupported / times out.
   */
  getPosition(timeoutMs = 8000): Promise<Coords> {
    return new Promise(resolve => {
      if (!('geolocation' in navigator)) {
        this._coords$.next(this.fallback);
        return resolve(this.fallback);
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const c: Coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          this._coords$.next(c);
          resolve(c);
        },
        () => {
          this._coords$.next(this.fallback);
          resolve(this.fallback);
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
      );
    });
  }

  /**
   * Haversine distance in km between two coordinates. Same formula
   * the backend uses for NearbyParkingLotResponse.distanceKm, useful
   * client-side for instant UI sorting / labels.
   */
  static distanceKm(a: Coords, b: Coords): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
}

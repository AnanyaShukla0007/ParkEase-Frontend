import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ParkingLot,
  NearbyParkingLot,
  CreateParkingLotRequest
} from '../models/api-models';

const unwrap = <T>(res: any): T => res?.data ?? res;

@Injectable({ providedIn: 'root' })
export class ParkingLotService {
  private readonly base = `${environment.apiUrl}/parkinglots`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ParkingLot[]> {
    return this.http.get<any>(this.base).pipe(map(r => unwrap<ParkingLot[]>(r)));
  }

  getById(id: number): Observable<ParkingLot> {
    return this.http.get<any>(`${this.base}/${id}`)
      .pipe(map(r => unwrap<ParkingLot>(r)));
  }

  getByCity(city: string): Observable<ParkingLot[]> {
    return this.http.get<any>(`${this.base}/city/${encodeURIComponent(city)}`)
      .pipe(map(r => unwrap<ParkingLot[]>(r)));
  }

  getByManager(managerId: number): Observable<ParkingLot[]> {
    return this.http.get<any>(`${this.base}/manager/${managerId}`)
      .pipe(map(r => unwrap<ParkingLot[]>(r)));
  }

  nearby(lat: number, lng: number): Observable<NearbyParkingLot[]> {
    const params = new HttpParams()
      .set('lat', lat)
      .set('lng', lng);

    return this.http.get<any>(`${this.base}/nearby`, { params })
      .pipe(map(r => unwrap<NearbyParkingLot[]>(r)));
  }

  create(body: CreateParkingLotRequest): Observable<ParkingLot> {
    return this.http.post<any>(this.base, body)
      .pipe(map(r => unwrap<ParkingLot>(r)));
  }

  update(id: number, body: Partial<CreateParkingLotRequest>): Observable<ParkingLot> {
    return this.http.put<any>(`${this.base}/${id}`, body)
      .pipe(map(r => unwrap<ParkingLot>(r)));
  }

  approve(id: number): Observable<ParkingLot> {
    return this.http.patch<any>(`${this.base}/${id}/approve`, {})
      .pipe(map(r => unwrap<ParkingLot>(r)));
  }

  reject(id: number): Observable<ParkingLot> {
    return this.http.patch<any>(`${this.base}/${id}/reject`, {})
      .pipe(map(r => unwrap<ParkingLot>(r)));
  }

  activate(id: number): Observable<ParkingLot> {
    return this.http.patch<any>(`${this.base}/${id}/activate`, {})
      .pipe(map(r => unwrap<ParkingLot>(r)));
  }

  deactivate(id: number): Observable<ParkingLot> {
    return this.http.patch<any>(`${this.base}/${id}/deactivate`, {})
      .pipe(map(r => unwrap<ParkingLot>(r)));
  }

  setOpen(id: number, isOpen: boolean): Observable<ParkingLot> {
    return this.update(id, { isOpen } as Partial<CreateParkingLotRequest>);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

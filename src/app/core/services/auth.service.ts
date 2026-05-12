// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
  ManagerApplication,
  ManagerApplicationRequest,
  ApprovalCredentials
} from '../models/api-models';

const TOKEN_KEY = 'parkease.accessToken';
const REFRESH_KEY = 'parkease.refreshToken';
const USER_KEY = 'parkease.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/auth`;
  private readonly _user$ = new BehaviorSubject<User | null>(this.readUser());

  readonly user$ = this._user$.asObservable();

  constructor(private http: HttpClient) {
    if (this.accessToken && this._user$.value) {
      this.refreshProfile();
    }
  }

  get currentUser(): User | null {
    return this._user$.value;
  }

  get accessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.accessToken && !!this.currentUser;
  }

  get role(): UserRole | null {
    return this.currentUser?.role ?? null;
  }

  homeFor(role: UserRole | null): string {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'MANAGER': return '/manager';
      case 'DRIVER': return '/driver';
      default: return '/login';
    }
  }

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, body)
      .pipe(tap(res => this.persist(res)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    const safe = {
      ...body,
      role: 'DRIVER' as UserRole,
      vehiclePlate: null
    };

    return this.http.post<AuthResponse>(`${this.base}/register`, safe)
      .pipe(tap(res => this.persist(res)));
  }

  googleAuth(body: {
    email: string;
    fullName: string;
    googleId: string;
    role?: UserRole;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/google`, body)
      .pipe(tap(res => this.persist(res)));
  }

  applyAsManager(body: ManagerApplicationRequest): Observable<ManagerApplication> {
    return this.http.post<ManagerApplication>(`${this.base}/manager/apply`, body);
  }

  listManagerApplications(): Observable<ManagerApplication[]> {
    return this.http.get<ManagerApplication[]>(`${this.base}/manager/applications`);
  }

  approveManagerApplication(id: number, lotName: string): Observable<ApprovalCredentials> {
    return this.http.post<ApprovalCredentials>(
      `${this.base}/manager/applications/${id}/approve`,
      { lotName }
    );
  }

  rejectManagerApplication(id: number, reason: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/manager/applications/${id}/reject`,
      { reason }
    );
  }

  // NEW: DRIVER FORGOT PASSWORD
  requestDriverOtp(emailOrPhone: string): Observable<any> {
    return this.http.post(`${this.base}/driver/forgot-password/request`, {
      emailOrPhone
    });
  }

  verifyDriverOtp(emailOrPhone: string, code: string): Observable<any> {
    return this.http.post(`${this.base}/driver/forgot-password/verify`, {
      emailOrPhone,
      code
    });
  }

  resetDriverPassword(
    emailOrPhone: string,
    code: string,
    newPassword: string
  ): Observable<any> {
    return this.http.post(`${this.base}/driver/forgot-password/reset`, {
      emailOrPhone,
      code,
      newPassword
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.base}/password`, {
      currentPassword,
      newPassword
    });
  }

  // NEW: MANAGER RESET REQUEST
  requestManagerReset(): Observable<any> {
    return this.http.post(`${this.base}/manager/request-password-reset`, {});
  }

  getPendingManagerResetRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/manager/reset-requests`);
  }

  approveManagerResetRequest(id: number): Observable<any> {
    return this.http.post(`${this.base}/manager/reset-requests/${id}/approve`, {});
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user$.next(null);
  }

  private refreshProfile(): void {
    this.http.get<User>(`${this.base}/profile`).pipe(
      catchError(() => of(null))
    ).subscribe(user => {
      if (!user) return;

      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this._user$.next(user);
    });
  }

  private persist(res: AuthResponse): void {
    if (!res || !res.accessToken || !res.user) {
      throw new Error('Invalid authentication response from server.');
    }

    localStorage.setItem(TOKEN_KEY, res.accessToken);

    if (res.refreshToken) {
      localStorage.setItem(REFRESH_KEY, res.refreshToken);
    } else {
      localStorage.removeItem(REFRESH_KEY);
    }

    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user$.next(res.user);
  }

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  }
}

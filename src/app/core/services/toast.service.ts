import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  /** ms before auto-dismiss; 0 = sticky */
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts$.asObservable();

  show(kind: ToastKind, title: string, message = '', duration = 4000): number {
    const id = this.nextId++;
    const toast: Toast = { id, kind, title, message, duration };
    this._toasts$.next([...this._toasts$.value, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }

  success(title: string, message = '', duration = 4000): number {
    return this.show('success', title, message, duration);
  }
  error(title: string, message = '', duration = 6000): number {
    return this.show('error', title, message, duration);
  }
  info(title: string, message = '', duration = 4000): number {
    return this.show('info', title, message, duration);
  }
  warning(title: string, message = '', duration = 5000): number {
    return this.show('warning', title, message, duration);
  }

  dismiss(id: number): void {
    this._toasts$.next(this._toasts$.value.filter(t => t.id !== id));
  }
}

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When set, the modal will show a single text input prefilled with this value */
  promptDefault?: string;
  promptLabel?: string;
}

export interface ConfirmResponse {
  confirmed: boolean;
  /** Set when promptDefault was provided */
  value?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _request$ = new Subject<ConfirmRequest>();
  private readonly _response$ = new Subject<ConfirmResponse>();

  readonly request$: Observable<ConfirmRequest> = this._request$.asObservable();

  ask(req: ConfirmRequest): Promise<ConfirmResponse> {
    return new Promise(resolve => {
      const sub = this._response$.subscribe(res => {
        sub.unsubscribe();
        resolve(res);
      });
      this._request$.next(req);
    });
  }

  /** Called by the modal component to deliver the user's choice. */
  resolve(res: ConfirmResponse): void {
    this._response$.next(res);
  }
}

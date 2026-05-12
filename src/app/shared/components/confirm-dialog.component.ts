import { Component, OnInit } from '@angular/core';
import { ConfirmRequest, ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="overlay" *ngIf="open" (click)="cancel()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3 class="modal-title">{{ req?.title }}</h3>
        <p class="modal-msg">{{ req?.message }}</p>

        <div class="prompt-field" *ngIf="req?.promptDefault !== undefined">
          <label>{{ req?.promptLabel || 'Value' }}</label>
          <input #pin type="text" [value]="req!.promptDefault!" (input)="value = pin.value">
        </div>

        <div class="modal-actions">
          <button class="btn ghost" (click)="cancel()">
            {{ req?.cancelLabel || 'Cancel' }}
          </button>
          <button class="btn"
                  [class.danger]="req?.danger"
                  (click)="confirm()">
            {{ req?.confirmLabel || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .overlay {
      position: fixed; inset: 0;
      background: rgba(5, 10, 20, 0.78);
      backdrop-filter: blur(8px);
      z-index: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: fade .2s;
    }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    .modal {
      background: var(--ink-800, #0a1222);
      border: 1px solid var(--border-strong, rgba(255, 216, 77, 0.35));
      border-radius: 18px;
      padding: 28px 32px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.55);
      animation: pop .3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes pop {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-title {
      font-family: 'Fraunces', serif;
      font-weight: 700;
      font-size: 1.4rem;
      color: var(--paper, #f4ecd8);
      margin: 0 0 10px;
    }
    .modal-msg {
      color: var(--text-dim, #8a9bc0);
      line-height: 1.55;
      margin: 0 0 24px;
    }
    .prompt-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 24px;
    }
    .prompt-field label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.14em;
      color: var(--text-faint, #5a6a92);
      text-transform: uppercase;
    }
    .prompt-field input {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border, rgba(255, 216, 77, 0.12));
      color: var(--paper, #f4ecd8);
      padding: 12px 14px;
      border-radius: 8px;
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 1rem;
    }
    .prompt-field input:focus {
      outline: none;
      border-color: var(--amber, #ffd84d);
    }
    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    @media (max-width: 480px) {
      .modal-actions .btn { flex: 1; justify-content: center; }
    }
  `]
})
export class ConfirmDialogComponent implements OnInit {
  open = false;
  req: ConfirmRequest | null = null;
  value = '';

  constructor(private svc: ConfirmService) {}

  ngOnInit(): void {
    this.svc.request$.subscribe(r => {
      this.req = r;
      this.value = r.promptDefault ?? '';
      this.open = true;
    });
  }

  cancel(): void {
    this.svc.resolve({ confirmed: false });
    this.open = false;
  }

  confirm(): void {
    const res = this.req?.promptDefault !== undefined
      ? { confirmed: true, value: this.value }
      : { confirmed: true };
    this.svc.resolve(res);
    this.open = false;
  }
}

import { Component, OnInit } from '@angular/core';
import { Toast, ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div *ngFor="let t of toasts; trackBy: trackById"
           class="toast"
           [class.success]="t.kind === 'success'"
           [class.error]="t.kind === 'error'"
           [class.info]="t.kind === 'info'"
           [class.warning]="t.kind === 'warning'">
        <div class="toast-icon">
          <span *ngIf="t.kind === 'success'">✓</span>
          <span *ngIf="t.kind === 'error'">!</span>
          <span *ngIf="t.kind === 'info'">i</span>
          <span *ngIf="t.kind === 'warning'">⚠</span>
        </div>
        <div class="toast-body">
          <div class="toast-title">{{ t.title }}</div>
          <div class="toast-msg" *ngIf="t.message">{{ t.message }}</div>
        </div>
        <button class="toast-close" (click)="dismiss(t.id)" aria-label="Dismiss">×</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .toast-stack {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: calc(100vw - 48px);
    }
    @media (max-width: 600px) {
      .toast-stack {
        top: auto;
        bottom: 16px;
        right: 16px;
        left: 16px;
        max-width: none;
      }
    }
    .toast {
      pointer-events: auto;
      display: grid;
      grid-template-columns: 36px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 14px 18px;
      border-radius: 14px;
      background: rgba(10, 18, 34, 0.96);
      border: 1px solid var(--border-strong, rgba(255, 216, 77, 0.35));
      backdrop-filter: blur(20px);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
      color: var(--paper, #f4ecd8);
      min-width: 280px;
      max-width: 420px;
      animation: toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes toast-in {
      from { transform: translateX(40px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast.success { border-color: rgba(198, 255, 77, 0.5); }
    .toast.error { border-color: rgba(255, 93, 115, 0.55); }
    .toast.warning { border-color: rgba(255, 216, 77, 0.5); }
    .toast.info { border-color: rgba(94, 234, 212, 0.5); }
    .toast-icon {
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      font-size: 1rem;
    }
    .toast.success .toast-icon { background: var(--lime, #c6ff4d); color: #050a14; }
    .toast.error .toast-icon { background: var(--rose, #ff5d73); color: #fff; }
    .toast.warning .toast-icon { background: var(--amber, #ffd84d); color: #050a14; }
    .toast.info .toast-icon { background: var(--cyan, #5eead4); color: #050a14; }
    .toast-body { min-width: 0; }
    .toast-title {
      font-family: 'Fraunces', serif;
      font-weight: 600;
      font-size: 1rem;
      color: var(--paper, #f4ecd8);
    }
    .toast-msg {
      color: var(--text-dim, #8a9bc0);
      font-size: 0.85rem;
      margin-top: 2px;
      line-height: 1.4;
    }
    .toast-close {
      appearance: none;
      background: transparent;
      border: none;
      color: var(--text-faint, #5a6a92);
      font-size: 1.4rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 4px;
      transition: color 0.2s;
    }
    .toast-close:hover { color: var(--paper, #f4ecd8); }
  `]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toast: ToastService) {}

  ngOnInit(): void {
    this.toast.toasts$.subscribe(list => this.toasts = list);
  }

  dismiss(id: number): void { this.toast.dismiss(id); }

  trackById(_: number, t: Toast): number { return t.id; }
}

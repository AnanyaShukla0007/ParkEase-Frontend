import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-analog-clock',
  template: `
    <div class="clock-wrap" aria-label="Current time">
      <div class="clock-face">
        <span class="tick t12"></span>
        <span class="tick t3"></span>
        <span class="tick t6"></span>
        <span class="tick t9"></span>
        <span class="hand hour" [style.transform]="hourTransform"></span>
        <span class="hand minute" [style.transform]="minuteTransform"></span>
        <span class="hand second" [style.transform]="secondTransform"></span>
        <span class="pin"></span>
      </div>
      <span class="clock-time mono">{{ label }}</span>
    </div>
  `,
  styles: [`
    .clock-wrap {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border: 1px solid rgba(255,216,77,.18);
      border-radius: 999px;
      background: rgba(255,255,255,.035);
      color: var(--paper);
    }
    .clock-face {
      width: 34px;
      height: 34px;
      border: 2px solid rgba(255,216,77,.7);
      border-radius: 50%;
      position: relative;
      background: radial-gradient(circle, rgba(255,216,77,.12), rgba(255,255,255,.02));
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
    }
    .tick {
      position: absolute;
      background: rgba(244,236,216,.75);
      border-radius: 2px;
    }
    .t12, .t6 { width: 2px; height: 5px; left: 14px; }
    .t12 { top: 3px; }
    .t6 { bottom: 3px; }
    .t3, .t9 { width: 5px; height: 2px; top: 14px; }
    .t3 { right: 3px; }
    .t9 { left: 3px; }
    .hand {
      position: absolute;
      left: 15px;
      bottom: 15px;
      transform-origin: 50% 100%;
      border-radius: 2px;
    }
    .hour { width: 3px; height: 9px; background: var(--paper); }
    .minute { width: 2px; height: 12px; background: var(--amber); }
    .second { width: 1px; height: 13px; background: var(--cyan); }
    .pin {
      position: absolute;
      width: 6px;
      height: 6px;
      left: 12px;
      top: 12px;
      border-radius: 50%;
      background: var(--amber);
    }
    .clock-time {
      font-size: .7rem;
      letter-spacing: .08em;
      color: var(--text-dim);
      white-space: nowrap;
    }
    @media (max-width: 760px) {
      .clock-time { display: none; }
    }
  `]
})
export class AnalogClockComponent implements OnInit, OnDestroy {
  label = '';
  hourTransform = '';
  minuteTransform = '';
  secondTransform = '';
  private timer?: number;

  ngOnInit(): void {
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) window.clearInterval(this.timer);
  }

  private tick(): void {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    this.secondTransform = `rotate(${seconds * 6}deg)`;
    this.minuteTransform = `rotate(${minutes * 6}deg)`;
    this.hourTransform = `rotate(${hours * 30}deg)`;
    this.label = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

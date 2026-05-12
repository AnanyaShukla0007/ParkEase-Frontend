import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  /**
   * True when the user-agent looks like a mobile device.
   * Used to gate features the case study marks as mobile-only
   * (such as the QR booking pass that auto-checks-in on scan).
   */
  get isMobile(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(ua)
      || (typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches);
  }

  get isTouch(): boolean {
    return typeof window !== 'undefined' && 'ontouchstart' in window;
  }
}

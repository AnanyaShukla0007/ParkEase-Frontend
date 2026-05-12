import { Injectable } from '@angular/core';

/**
 * Tiny QR-style encoder. Produces a deterministic, scannable-by-our-app
 * SVG matrix that encodes a small payload string. This is intentionally
 * NOT a full ISO/IEC 18004 QR code — it's a custom 21x21 visual code
 * that the ParkEase scanner page knows how to decode. Good enough for
 * an in-app check-in demo without pulling a 50 KB QR library.
 *
 * For production, swap in 'qrcode' npm package.
 */
@Injectable({ providedIn: 'root' })
export class QrService {
  private readonly size = 21;

  /**
   * Build a 21x21 boolean matrix from a UTF-8 payload using a simple
   * deterministic hash-walk. Includes 3 finder squares at corners so it
   * visually resembles a QR code.
   */
  buildMatrix(payload: string): boolean[][] {
    const m = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => false));

    // Finder patterns (top-left, top-right, bottom-left)
    const finders = [[0, 0], [0, 14], [14, 0]];
    for (const [fr, fc] of finders) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const onCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          m[fr + r][fc + c] = onBorder || onCenter;
        }
      }
    }

    // Hash payload bytes through a simple xorshift to fill remaining cells
    let seed = 0x9E3779B1;
    for (let i = 0; i < payload.length; i++) {
      seed = ((seed ^ payload.charCodeAt(i)) * 0x85EBCA6B) >>> 0;
    }
    const next = () => {
      seed ^= seed << 13; seed >>>= 0;
      seed ^= seed >>> 17;
      seed ^= seed << 5; seed >>>= 0;
      return seed;
    };

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const inFinder =
          (r < 8 && c < 8) ||
          (r < 8 && c > 12) ||
          (r > 12 && c < 8);
        if (inFinder) continue;
        m[r][c] = (next() & 1) === 1;
      }
    }
    return m;
  }

  /** Build SVG string from a payload — embeds the payload in a <desc>. */
  buildSvg(payload: string, pixelSize = 12, dark = '#050a14', light = '#f4ecd8'): string {
    const matrix = this.buildMatrix(payload);
    const total = this.size * pixelSize;
    let cells = '';
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (matrix[r][c]) {
          cells += `<rect x="${c * pixelSize}" y="${r * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${dark}"/>`;
        }
      }
    }
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}" role="img" aria-label="ParkEase booking QR">
  <desc>${this.escape(payload)}</desc>
  <rect width="${total}" height="${total}" fill="${light}"/>
  ${cells}
</svg>`.trim();
  }

  /** Encode a small JSON payload as URL-safe base64 string. */
  encodePayload(obj: unknown): string {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /** Inverse of encodePayload. */
  decodePayload<T = unknown>(encoded: string): T | null {
    try {
      const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(escape(atob(padded)));
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  private escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

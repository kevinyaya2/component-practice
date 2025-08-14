import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-counter',
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="card" role="group" aria-label="計數器">
        <header class="card__header">
          <h2>🧮 計數器</h2>
          <button
            class="reset"
            type="button"
            (click)="reset()"
            aria-label="重設"
          >
            重設
          </button>
        </header>

        <div class="display" aria-live="polite" aria-atomic="true">
          <div class="display__value" [attr.data-value]="count()">
            {{ count() }}
          </div>
        </div>

        <div class="controls">
          <button
            class="btn btn--ghost"
            type="button"
            (click)="decrement()"
            (pointerdown)="startHold(-1, $event)"
            (pointerup)="stopHold()"
            (pointerleave)="stopHold()"
            aria-label="減一"
          >
            −1
          </button>

          <button
            class="btn"
            type="button"
            (click)="increment()"
            (pointerdown)="startHold(1, $event)"
            (pointerup)="stopHold()"
            (pointerleave)="stopHold()"
            aria-label="加一"
          >
            +1
          </button>
        </div>

        <footer class="hint">
          <span>鍵盤：← 減少，→ 增加</span>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ===== 置中佈局（移除大背景） ===== */
      .page {
        min-height: 100vh;
        display: grid;
        justify-items: center; /* 水平置中 */
        align-content: start; /* 垂直靠上 */
        padding: 24px;
        background: transparent; /* 取消原本的大漸層 */
      }

      /* ===== 卡片 ===== */
      .card {
        width: min(560px, 92vw);
        background: linear-gradient(135deg, #ffffff 0%, #f7faff 100%);
        border: 1px solid rgba(26, 48, 80, 0.08);
        border-radius: 20px;
        box-shadow: 0 12px 30px rgba(16, 24, 40, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.6);
        padding: 22px 22px 16px;
        backdrop-filter: blur(4px);
      }

      .card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      h2 {
        margin: 0;
        font-weight: 800;
        font-size: 1.25rem;
        letter-spacing: 0.3px;
        color: #1f2a44;
      }

      .reset {
        border: 0;
        background: transparent;
        color: #3a7dff;
        font-weight: 600;
        padding: 6px 10px;
        border-radius: 10px;
        transition: background 0.2s ease, transform 0.06s ease;
        cursor: pointer;
      }
      .reset:hover {
        background: rgba(58, 125, 255, 0.08);
      }
      .reset:active {
        transform: translateY(1px);
      }

      /* ===== 顯示區 ===== */
      .display {
        display: grid;
        place-items: center;
        margin: 6px 0 16px;
        padding: 18px;
        background: linear-gradient(180deg, #f3f6ff, #ffffff);
        border: 1px solid rgba(26, 48, 80, 0.06);
        border-radius: 16px;
      }

      .display__value {
        font-variant-numeric: tabular-nums;
        font-size: clamp(2.8rem, 7vw, 4.2rem);
        line-height: 1;
        font-weight: 900;
        color: #0f1e4a;
        text-shadow: 0 1px 0 #fff;
        transition: transform 0.12s ease;
        will-change: transform;
        animation: pop 0.18s ease; /* 小彈跳 */
      }
      @keyframes pop {
        from {
          transform: scale(0.96);
        }
        to {
          transform: scale(1);
        }
      }

      /* ===== 控制區 ===== */
      .controls {
        display: grid;
        grid-template-columns: 1fr 1.1fr;
        gap: 12px;
        margin: 6px 0 6px;
      }

      .btn {
        appearance: none;
        border: 0;
        cursor: pointer;
        padding: 14px 18px;
        font-size: 1.05rem;
        font-weight: 800;
        border-radius: 14px;
        color: white;
        background: linear-gradient(135deg, #5c8cff, #3a7dff);
        box-shadow: 0 10px 18px rgba(58, 125, 255, 0.28),
          inset 0 1px 0 rgba(255, 255, 255, 0.25);
        transition: transform 0.06s ease, box-shadow 0.2s ease, filter 0.2s ease;
        user-select: none;
        touch-action: manipulation;
      }
      .btn:hover {
        box-shadow: 0 12px 22px rgba(58, 125, 255。.32),
          inset 0 1px 0 rgba(255, 255, 255, 0.25);
        filter: saturate(1.05);
      }
      .btn:active {
        transform: translateY(1px);
      }

      .btn--ghost {
        background: #ffffff;
        color: #10326b;
        border: 1px solid rgba(16, 50, 107, 0.12);
        box-shadow: 0 10px 18px rgba(16, 24, 40, 0.06),
          inset 0 1px 0 rgba(255, 255, 255, 0.45);
      }
      .btn--ghost:hover {
        background: linear-gradient(180deg, #ffffff, #f6f9ff);
        box-shadow: 0 12px 22px rgba(16, 24, 40, 0.09),
          inset 0 1px 0 rgba(255, 255, 255, 0.55);
      }

      .hint {
        margin-top: 10px;
        text-align: center;
        color: #6b7a99;
        font-size: 0.88rem;
        user-select: none;
      }

      /* ===== 簡化暗色模式（不再覆蓋整頁背景） ===== */
      @media (prefers-color-scheme: dark) {
        .card {
          background: linear-gradient(135deg, #111a33, #0f162b);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        h2 {
          color: #e7ecff;
        }
        .display {
          background: linear-gradient(180deg, #0f1a36, #0b142a);
          border-color: rgba(255, 255, 255, 0.06);
        }
        .display__value {
          color: #f0f4ff;
          text-shadow: none;
        }
        .btn--ghost {
          background: #121c36;
          color: #e6edff;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .hint {
          color: #9fb1e7;
        }
      }
    `,
  ],
})
export class CounterComponent {
  count = signal(0);

  private holdTimer?: number;
  private holdInterval?: number;

  increment() {
    this.count.update((c) => c + 1);
  }
  decrement() {
    this.count.update((c) => c - 1);
  }
  reset() {
    this.count.set(0);
  }

  /** 按住長按：先延遲再快速連點 */
  startHold(delta: 1 | -1, ev: PointerEvent) {
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    this.stopHold();
    this.holdTimer = window.setTimeout(() => {
      this.holdInterval = window.setInterval(() => {
        delta > 0 ? this.increment() : this.decrement();
      }, 60);
    }, 300);
  }

  stopHold() {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = undefined;
    }
    if (this.holdInterval) {
      clearInterval(this.holdInterval);
      this.holdInterval = undefined;
    }
  }

  /** 左右方向鍵控制 */
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.increment();
    else if (e.key === 'ArrowLeft') this.decrement();
  }
}

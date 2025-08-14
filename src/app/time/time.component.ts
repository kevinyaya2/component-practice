import { Component, OnDestroy, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

type Persisted = {
  workMinutes: number;
  breakMinutes: number;
  isWork: boolean;
  remainingSec: number;
  completed: number;
  running: boolean;
  lastTickAt: number;   // Date.now()
  notifyOn: boolean;    // 是否啟用通知（使用者偏好）
};

const STORAGE_KEY = 'pomodoro-v2'; // 升版 key，避免舊格式衝突
const DEFAULTS = { work: 25, rest: 5, notifyOn: true };

@Component({
  standalone: true,
  selector: 'app-time',
  imports: [CommonModule],
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.css'],
})
export class TimeComponent implements OnInit, OnDestroy {
  // ---- 設定（分鐘） ----
  workMinutes = signal(DEFAULTS.work);
  breakMinutes = signal(DEFAULTS.rest);

  // ---- 狀態 ----
  isWork = signal(true);
  remainingSec = signal(this.workMinutes() * 60);
  completed = signal(0);
  running = signal(false);

  // 通知
  notifyOn = signal(DEFAULTS.notifyOn);
  notifPermission = signal<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default');

  private sub?: Subscription;

  // ---- 顯示用 ----
  minutes = computed(() => Math.floor(this.remainingSec() / 60).toString().padStart(2, '0'));
  seconds = computed(() => (this.remainingSec() % 60).toString().padStart(2, '0'));

  progress = computed(() => {
    const total = (this.isWork() ? this.workMinutes() : this.breakMinutes()) * 60;
    const done = total - this.remainingSec();
    return Math.max(0, Math.min(100, (done / total) * 100));
  });

  percent = computed(() => Math.round(this.progress()));

  // 自動持久化（設定＋狀態）
  persist = effect(() => {
    const data: Persisted = {
      workMinutes: this.workMinutes(),
      breakMinutes: this.breakMinutes(),
      isWork: this.isWork(),
      remainingSec: this.remainingSec(),
      completed: this.completed(),
      running: this.running(),
      lastTickAt: Date.now(),
      notifyOn: this.notifyOn(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  });

  ngOnInit(): void {
    this.loadState();
  }

  ngOnDestroy(): void {
    this.pause();
  }

  // ---- 控制 ----
  start() {
    if (this.running()) return;
    this.running.set(true);
    this.sub = interval(1000).subscribe(() => {
      if (this.remainingSec() > 0) {
        this.remainingSec.update(s => s - 1);
      } else {
        this.switchPhase();
      }
    });
  }

  pause() {
    this.sub?.unsubscribe();
    this.sub = undefined;
    this.running.set(false);
  }

  reset() {
    this.pause();
    this.isWork.set(true);
    this.remainingSec.set(this.workMinutes() * 60);
  }

  resetSettingsToDefaults() {
    // 還原設定（不動已完成番茄數；計時器重置比較直覺）
    this.workMinutes.set(DEFAULTS.work);
    this.breakMinutes.set(DEFAULTS.rest);
    this.notifyOn.set(DEFAULTS.notifyOn);
    this.reset();
  }

  private switchPhase() {
    if (this.isWork()) {
      this.completed.update(v => v + 1);
      this.isWork.set(false);
      this.remainingSec.set(this.breakMinutes() * 60);
      this.notify('休息時間開始', `稍微放鬆一下～ ${this.breakMinutes()} 分鐘`);
    } else {
      this.isWork.set(true);
      this.remainingSec.set(this.workMinutes() * 60);
      this.notify('專注時間開始', `來專心一下吧！ ${this.workMinutes()} 分鐘`);
    }
  }

  // ---- 表單（保母級修法 A）----
  updateWork(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const n = Math.max(1, Number(input.value) || this.workMinutes());
    this.workMinutes.set(n);
    if (this.isWork() && !this.running()) this.remainingSec.set(n * 60);
  }

  updateBreak(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const n = Math.max(1, Number(input.value) || this.breakMinutes());
    this.breakMinutes.set(n);
    if (!this.isWork() && !this.running()) this.remainingSec.set(n * 60);
  }

  onNotifyToggle(ev: Event) {
  const el = ev.target as HTMLInputElement;
  this.notifyOn.set(!!el.checked);
}

  // ---- Notification API ----
  async requestNotificationPermission() {
    if (typeof Notification === 'undefined') {
      alert('這個瀏覽器不支援桌面通知。');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      this.notifPermission.set(perm);
      if (perm === 'granted') {
        this.notify('已啟用通知', '之後切換專注/休息會收到提醒。');
      }
    } catch {
      // ignore
    }
  }

  private notify(title: string, body: string) {
    // 使用者偏好 + 瀏覽器權限都 OK 才通知
    if (!this.notifyOn()) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    // 可選：避免視窗在前景時吵（想要即時感就拿掉這判斷）
    // if (document.visibilityState === 'visible') return;

    try {
      new Notification(title, { body, icon: undefined /* 可放圖示 URL */ });
    } catch {
      // 某些環境（如 iframe）可能被政策擋掉，當作 no-op
    }
  }

  // ---- 載入與「自動續跑」 ----
  private loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const d = JSON.parse(raw) as Persisted;

      // 基本防呆
      if (
        typeof d.workMinutes !== 'number' ||
        typeof d.breakMinutes !== 'number' ||
        typeof d.remainingSec !== 'number' ||
        typeof d.completed !== 'number' ||
        typeof d.isWork !== 'boolean' ||
        typeof d.running !== 'boolean' ||
        typeof d.lastTickAt !== 'number' ||
        typeof d.notifyOn !== 'boolean'
      ) return;

      this.workMinutes.set(Math.max(1, Math.floor(d.workMinutes)));
      this.breakMinutes.set(Math.max(1, Math.floor(d.breakMinutes)));
      this.isWork.set(d.isWork);
      this.completed.set(Math.max(0, Math.floor(d.completed)));
      this.remainingSec.set(Math.max(0, Math.floor(d.remainingSec)));
      this.notifyOn.set(d.notifyOn);

      // 若離開時在跑，用時間差續跑
      if (d.running) {
        let delta = Math.floor((Date.now() - d.lastTickAt) / 1000);
        while (delta > 0) {
          const left = this.remainingSec();
          if (delta < left) {
            this.remainingSec.set(left - delta);
            delta = 0;
          } else {
            delta -= left;
            this.switchPhase();
          }
        }
        this.start();
      }

      // 更新目前的 Notification 權限顯示
      if (typeof Notification !== 'undefined') {
        this.notifPermission.set(Notification.permission);
      }
    } catch {
      // ignore parse errors
    }
  }
}


import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../services/weather.service';

type City = { name: string; lat: number; lon: number };

const CITIES: City[] = [
  { name: '臺北',   lat: 25.0375, lon: 121.5637 },
  { name: '新北',   lat: 25.0126, lon: 121.4657 },
  { name: '基隆',   lat: 25.1283, lon: 121.7419 },
  { name: '桃園',   lat: 24.9937, lon: 121.3010 },
  { name: '新竹市', lat: 24.8138, lon: 120.9675 },
  { name: '新竹縣', lat: 24.8386, lon: 121.0069 },
  { name: '苗栗',   lat: 24.5602, lon: 120.8214 },
  { name: '臺中',   lat: 24.1477, lon: 120.6736 },
  { name: '彰化',   lat: 24.0730, lon: 120.5430 },
  { name: '南投',   lat: 23.9157, lon: 120.6630 },
  { name: '雲林',   lat: 23.7074, lon: 120.5410 },
  { name: '嘉義市', lat: 23.4800, lon: 120.4491 },
  { name: '嘉義縣', lat: 23.4589, lon: 120.3247 },
  { name: '臺南',   lat: 22.9997, lon: 120.2270 },
  { name: '高雄',   lat: 22.6273, lon: 120.3014 },
  { name: '屏東',   lat: 22.6813, lon: 120.4810 },
  { name: '宜蘭',   lat: 24.7570, lon: 121.7530 },
  { name: '花蓮',   lat: 23.9770, lon: 121.6040 },
  { name: '臺東',   lat: 22.7560, lon: 121.1440 },
  { name: '澎湖',   lat: 23.5664, lon: 119.5766 },
  { name: '金門',   lat: 24.4340, lon: 118.3171 },
  { name: '連江',   lat: 26.1578, lon: 119.9499 }
];

function codeToTheme(code: number) {
  if (code === 0) return { label: '晴朗', icon: '☀️', theme: 'sunny' };
  if ([1, 2, 3].includes(code)) return { label: '多雲', icon: '⛅', theme: 'cloudy' };
  if (code >= 45 && code <= 48) return { label: '霧', icon: '🌫️', theme: 'fog' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: '降雨', icon: '🌧️', theme: 'rain' };
  if (code >= 71 && code <= 77) return { label: '降雪', icon: '❄️', theme: 'snow' };
  if (code >= 95) return { label: '雷雨', icon: '⛈️', theme: 'storm' };
  return { label: '—', icon: '🌈', theme: 'default' };
}

@Component({
  standalone: true,
  selector: 'app-weather',
  imports: [CommonModule],
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent {
  private api = inject(WeatherService);

  cities = CITIES;
  selectedCity = signal<City>(CITIES.find(c => c.name === '臺中')!);

  loading = signal(false);
  error = signal<string | null>(null);
  updatedAt = signal<Date | null>(null);

  unit = signal<'C' | 'F'>('C');
  tempC = signal<number | null>(null);
  feelC = signal<number | null>(null);
  code = signal<number | null>(null);

  temp = computed(() => this.convert(this.tempC()));
  feel = computed(() => this.convert(this.feelC()));
  status = computed(() => codeToTheme(this.code() ?? -1));

  constructor() {
    // 初次載入 + 切換城市時自動抓資料
    effect(() => {
      const { lat, lon } = this.selectedCity();
      this.fetch(lat, lon);
    });
  }

  toggleUnit() {
    this.unit.set(this.unit() === 'C' ? 'F' : 'C');
  }

  changeCity(name: string) {
    const c = this.cities.find(x => x.name === name);
    if (c) this.selectedCity.set(c);
  }

  private convert(v: number | null) {
    if (v == null) return null;
    return this.unit() === 'C' ? v : Math.round((v * 9) / 5 + 32);
  }

  private fetch(lat: number, lon: number) {
    this.loading.set(true);
    this.error.set(null);
    this.api.getNow(lat, lon).subscribe({
      next: (d) => {
        this.tempC.set(Math.round(d.tempC));
        this.feelC.set(Math.round(d.feelC));
        this.code.set(d.code);
        this.updatedAt.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.error.set('取得天氣失敗，稍後再試');
        this.loading.set(false);
      }
    });
  }
}

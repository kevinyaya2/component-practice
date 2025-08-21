import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

type OpenMeteoResponse = {
  current: { temperature_2m: number; apparent_temperature: number; weather_code: number };
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);
  getNow(lat: number, lon: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
    return this.http.get<OpenMeteoResponse>(url).pipe(
      map(res => ({
        tempC: Math.round(res.current.temperature_2m),
        feelC: Math.round(res.current.apparent_temperature),
        code: res.current.weather_code
      }))
    );
  }
}

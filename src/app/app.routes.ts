import { Routes } from '@angular/router';
import { CounterComponent } from './counter/counter.component';
import { UserCardComponent } from './user-card/user-card.component';
import { TimeComponent } from './time/time.component';
import { WeatherComponent } from './weather/weather.component';
import { InvestComponent } from './invest/invest.component';
import { TodoComponent } from './todo/todo.component';


export const routes: Routes = [
  { path: 'counter', component: CounterComponent },
  { path: 'user-card', component: UserCardComponent },
  { path: 'time', component: TimeComponent },
  { path: 'weather', component: WeatherComponent },
  { path: 'invest', component: InvestComponent },
  { path: 'todo', component: TodoComponent },
  { path: '', redirectTo: 'counter', pathMatch: 'full' },
];

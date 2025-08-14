import { Routes } from '@angular/router';
import { CounterComponent } from './counter/counter.component';
import { UserCardComponent } from './user-card/user-card.component';
import { TimeComponent } from './time/time.component';

export const routes: Routes = [
  { path: 'counter', component: CounterComponent },
  { path: 'user-card', component: UserCardComponent },
  { path: 'time', component: TimeComponent },
  { path: '', redirectTo: 'counter', pathMatch: 'full' },
];

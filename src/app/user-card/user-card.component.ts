import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-user-card',
  imports: [CommonModule],
  template: `
    <div class="card">
      <h3>{{ user?.name }}</h3>
      <p class="company">{{ user?.com }}</p>
      <p class="job">{{ user?.job }}</p>
      <hr />
      <p><strong>Phone：</strong>{{ user?.phone }}</p>
      <p><strong>Email：</strong>{{ user?.email }}</p>
    </div>
  `,
  styles: [`
    .card {
      border: 1px solid #ccc;
      border-radius: 10px;
      padding: 15px;
      width: 250px;
      background: linear-gradient(135deg, #f0f4ff, #ffffff);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      font-family: 'Segoe UI', sans-serif;
      transition: transform 0.2s ease-in-out;
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0,0,0,0.15);
    }
    h3 {
      margin: 0 0 5px 0;
      color: #2c3e50;
      font-size: 1.4rem;
    }
    .company {
      margin: 0;
      font-weight: bold;
      color: #4a90e2;
    }
    .job {
      margin: 0 0 10px 0;
      font-style: italic;
      color: #555;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 10px 0;
    }
    p {
      margin: 5px 0;
      color: #555;
    }
    strong {
      color: #333;
    }
  `]
})
export class UserCardComponent {
  @Input() user = {
    name: 'Kevin Liao',
    com: 'NEO COOLER',
    job: 'Front-End Engineer',
    phone: '(04) 2327-1317#505',
    email: 'kevin.liao@techmore.com.tw'
  };
}

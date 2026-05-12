import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  constructor(private router: Router) {}

  go(path: string): void { this.router.navigate([path]); }

  // Marquee content
  readonly marquee = [
    'FIND', 'RESERVE', 'PARK', 'EFFORTLESSLY',
    'REAL-TIME AVAILABILITY', 'EV CHARGING', 'PRE-BOOKING', 'PAY-ON-EXIT'
  ];

  // Simulated live city bar chart
  readonly cities = [
    { name: 'Mathura',   occ: 72 },
    { name: 'Agra',      occ: 88 },
    { name: 'Delhi',     occ: 94 },
    { name: 'Gurugram',  occ: 81 },
    { name: 'Noida',     occ: 66 },
    { name: 'Jaipur',    occ: 54 }
  ];

  readonly steps = [
    { n: '01', title: 'Drop your pin', body: 'We lock onto your GPS and surface every registered lot within your radius — ranked by distance, price, and open spots.' },
    { n: '02', title: 'Pick your spot', body: 'Floor-by-floor, spot-by-spot. Filter by EV charging, handicap access, or vehicle class. See the exact bay before you arrive.' },
    { n: '03', title: 'Roll in, roll out', body: 'Digital check-in on arrival. Fare computed on checkout. Receipt in your inbox. No tickets, no attendants, no friction.' }
  ];
}

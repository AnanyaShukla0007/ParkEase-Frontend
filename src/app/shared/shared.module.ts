import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashNavComponent } from './components/dash-nav.component';
import { BookingQrComponent } from './components/booking-qr.component';
import { AnalogClockComponent } from './components/analog-clock.component';

@NgModule({
  declarations: [DashNavComponent, BookingQrComponent, AnalogClockComponent],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  exports: [
    DashNavComponent,
    BookingQrComponent,
    AnalogClockComponent,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule {}

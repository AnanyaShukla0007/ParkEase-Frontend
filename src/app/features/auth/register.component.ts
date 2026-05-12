import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./auth.shared.scss']
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+0-9\s-]{7,20}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.auth.register({
      ...this.form.value,
      role: 'DRIVER',
      vehiclePlate: null
    }).subscribe({
      next: () => {
        this.toast.success('Welcome to ParkEase', 'Your driver account is ready.');
        this.router.navigate(['/driver']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = err.error?.message
          || 'Could not create your account. Email may already be taken, or the gateway is offline.';
      }
    });
  }
}

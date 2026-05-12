import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./auth.shared.scss']
})
export class ForgotPasswordComponent {
  step = 1;
  loading = false;
  message = '';
  error = '';
  debugCode = '';

  form = this.fb.group({
    emailOrPhone: ['', Validators.required],
    code: [''],
    newPassword: ['', [Validators.minLength(8)]]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {}

  requestCode(): void {
    const value = this.form.value.emailOrPhone?.trim();

    if (!value) return;

    this.loading = true;
    this.error = '';
    this.message = '';
    this.debugCode = '';

    this.auth.requestDriverOtp(value).subscribe({
      next: (res) => {
        this.loading = false;
        this.step = 2;
        this.message = res?.message || 'Verification code sent.';
        this.debugCode = res?.debugCode || '';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to generate verification code.';
      }
    });
  }

  verifyCode(): void {
    const value = this.form.value.emailOrPhone!;
    const code = this.form.value.code?.trim();

    if (!code) return;

    this.loading = true;
    this.error = '';
    this.message = '';

    this.auth.verifyDriverOtp(value, code).subscribe({
      next: (res) => {
        this.loading = false;
        this.step = 3;
        this.message = res?.message || 'Code verified.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Invalid code.';
      }
    });
  }

  resetPassword(): void {
    const value = this.form.value.emailOrPhone!;
    const code = this.form.value.code!;
    const password = this.form.value.newPassword!;

    if (!password || password.length < 8) return;

    this.loading = true;
    this.error = '';
    this.message = '';

    this.auth.resetDriverPassword(value, code, password).subscribe({
      next: (res) => {
        this.loading = false;
        this.step = 4;
        this.message = res?.message || 'Password changed successfully.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Reset failed.';
      }
    });
  }
}

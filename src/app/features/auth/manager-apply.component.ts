import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-manager-apply',
  templateUrl: './manager-apply.component.html',
  styleUrls: ['./auth.shared.scss']
})
export class ManagerApplyComponent {
  form: FormGroup;
  loading = false;
  error = '';
  submitted = false;

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
      proposedLotName: ['', [Validators.required, Validators.maxLength(100)]],
      proposedAddress: ['', [Validators.required, Validators.maxLength(200)]],
      proposedCity: ['', [Validators.required, Validators.maxLength(60)]],
      message: ['', Validators.maxLength(500)]
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.auth.applyAsManager(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
        this.toast.success(
          'Application sent',
          'Admin will review and email you credentials once approved.'
        );
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = err.error?.message
          || 'Could not submit your application. Email may already be in use.';
      }
    });
  }

  goLogin(): void { this.router.navigate(['/login']); }
}

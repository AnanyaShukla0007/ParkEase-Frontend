import { AfterViewInit, Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./auth.shared.scss']
})
export class LoginComponent implements AfterViewInit {

  form: FormGroup;

  loading = false;

  error = '';

  showPassword = false;

  environmentGoogleConfigured =
    !!environment.googleClientId;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private zone: NgZone
  ) {

    this.form = this.fb.group({
      email: [
        '',
        [Validators.required, Validators.email]
      ],

      password: [
        '',
        [Validators.required, Validators.minLength(8)]
      ]
    });
  }

  ngAfterViewInit(): void {

    if (!environment.googleClientId) {
      console.error('Google Client ID missing');
      return;
    }

    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn(): void {

    const render = () => {

      if (typeof google === 'undefined') {
        console.warn('Google SDK not loaded yet');
        setTimeout(render, 300);
        return;
      }

      google.accounts.id.initialize({
        client_id: environment.googleClientId,

        callback: (response: { credential: string }) => {
          this.handleGoogleCredential(
            response.credential
          );
        }
      });

      const button =
        document.getElementById(
          'googleSignInButton'
        );

      if (!button) {
        console.error(
          'Google button container missing'
        );
        return;
      }

      google.accounts.id.renderButton(
        button,
        {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 360
        }
      );

      console.log('Google Sign-In initialized');
    };

    render();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.error = '';

    this.auth.login(this.form.value).subscribe({

      next: (res) => {

        this.loading = false;

        this.routeForRole(res.user.role);
      },

      error: (err: HttpErrorResponse) => {

        this.loading = false;

        if (err.status === 401) {
          this.error =
            'Wrong email or password.';
          return;
        }

        if (err.error?.message) {
          this.error = err.error.message;
          return;
        }

        if (err.message) {
          this.error = err.message;
          return;
        }

        this.error = 'Login failed.';
      }
    });
  }

  private handleGoogleCredential(
    credential: string
  ): void {

    console.log(
      'Google credential received'
    );

    const payload =
      this.decodeJwtPayload(credential);

    console.log(payload);

    if (!payload?.email) {

      this.zone.run(() => {

        this.error =
          'Google sign in did not return an email.';
      });

      return;
    }

    this.zone.run(() => {

      this.loading = true;

      this.error = '';

      this.auth.googleAuth({

        email: payload.email,

        fullName:
          payload.name || payload.email,

        googleId: payload.sub,

        role: 'DRIVER'

      }).subscribe({

        next: (res) => {

          this.loading = false;

          console.log(
            'Google login backend success'
          );

          this.routeForRole(
            res.user.role
          );
        },

        error: (err: HttpErrorResponse) => {

          this.loading = false;

          console.error(err);

          this.error =
            err.error?.message ||
            'Google sign in failed.';
        }
      });
    });
  }

  private decodeJwtPayload(
    token: string
  ): any {

    try {

      const base64 = token
        .split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      return JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split('')
            .map(c =>
              `%${(
                '00' +
                c.charCodeAt(0).toString(16)
              ).slice(-2)}`
            )
            .join('')
        )
      );

    } catch (error) {

      console.error(
        'JWT decode failed',
        error
      );

      return null;
    }
  }

  private routeForRole(
    role: string
  ): void {

    const target =
      role === 'ADMIN'
        ? '/admin'
        : role === 'MANAGER'
          ? '/manager'
          : '/driver';

    this.router.navigate([target]);
  }
}
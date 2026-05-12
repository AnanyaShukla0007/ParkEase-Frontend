import { NgModule, inject } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ManagerApplyComponent } from './features/auth/manager-apply.component';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
/**
 * If the user is already logged in, take them straight to their
 * dashboard instead of showing the landing page. This fixes the
 * 'refresh sends me to the landing/login screen' bug because every
 * authenticated route is preserved by the guard.
 */
const landingOrDashboard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) {
    router.navigateByUrl(auth.homeFor(auth.role));
    return false;
  }
  return true;
};

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
    canActivate: [landingOrDashboard]
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'manager-apply', component: ManagerApplyComponent },

  {
    path: 'driver',
    loadChildren: () => import('./features/driver/driver.module').then(m => m.DriverModule)
  },
  {
    path: 'manager',
    canActivate: [roleGuard(['MANAGER'])],
    loadChildren: () => import('./features/manager/manager.module').then(m => m.ManagerModule)
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN'])],
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    useHash: true
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}

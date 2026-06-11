import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.role() === 'admin') return true;
  if (auth.isAuthenticated()) return router.createUrlTree(['/shop']);
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: '/admin' } });
};
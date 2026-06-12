import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../../../shared/services/cart.service';

export const checkoutStepGuard: CanActivateFn = (route) => {
  const cart = inject(CartService);
  const router = inject(Router);

  // Extract step number from the URL path: /shop/checkout/step/N
  const fullUrl = route.url.map((s) => s.path).join('/');
  const stepMatch = fullUrl.match(/step\/(\d)/);
  const step = stepMatch ? +stepMatch[1] : 1;

  // Step 1 requires cart to have items
  if (step === 1) {
    if (cart.items().length === 0) {
      return router.createUrlTree(['/shop']);
    }
    return true;
  }

  // Steps 2+ require completed prior steps stored in sessionStorage
  const raw = sessionStorage.getItem('checkout_completed_steps');
  const completed: number[] = raw ? JSON.parse(raw) : [];

  // Must have completed every step before this one
  for (let i = 1; i < step; i++) {
    if (!completed.includes(i)) {
      return router.createUrlTree(['/shop/checkout/step', i]);
    }
  }

  return true;
};

export function markStepComplete(step: number): void {
  const raw = sessionStorage.getItem('checkout_completed_steps');
  const completed: number[] = raw ? JSON.parse(raw) : [];
  if (!completed.includes(step)) {
    completed.push(step);
    sessionStorage.setItem('checkout_completed_steps', JSON.stringify(completed));
  }
}

export function clearCheckoutProgress(): void {
  sessionStorage.removeItem('checkout_completed_steps');
}
import { Routes } from '@angular/router';
import { checkoutStepGuard } from './guards/checkout-step.guard';
import { productResolver } from './guards/product.resolver';
import { ShopShellComponent } from './shop-shell.component';

export const SHOP_ROUTES: Routes = [
  {
    path: '',
    component: ShopShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/shop/shop.component').then((c) => c.ShopComponent),
      },
      {
        path: 'products/:id',
        resolve: { product: productResolver },
        loadComponent: () =>
          import('./pages/product-detail/product-detail.component').then(
            (c) => c.ProductDetailComponent,
          ),
      },
      {
        path: 'checkout/step/1',
        canActivate: [checkoutStepGuard],
        loadComponent: () =>
          import('./pages/checkout-step1/checkout-step1.component').then(
            (c) => c.CheckoutStep1Component,
          ),
      },
      {
        path: 'checkout/step/2',
        canActivate: [checkoutStepGuard],
        loadComponent: () =>
          import('./pages/checkout-step2/checkout-step2.component').then(
            (c) => c.CheckoutStep2Component,
          ),
      },
      {
        path: 'checkout/step/3',
        canActivate: [checkoutStepGuard],
        loadComponent: () =>
          import('./pages/checkout-step3/checkout-step3.component').then(
            (c) => c.CheckoutStep3Component,
          ),
      },
      {
        path: 'order-confirmation/:id',
        loadComponent: () =>
          import('./pages/order-confirmation/order-confirmation.component').then(
            (c) => c.OrderConfirmationComponent,
          ),
      },
    ],
  },
];

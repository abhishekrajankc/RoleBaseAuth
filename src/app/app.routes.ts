import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './auth';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((c) => c.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./admin/admin.component').then((c) => c.AdminComponent),
    children: [
      {
        path: 'analytics',
        loadComponent: () => import('./admin/analytics/analytics.component').then((c) => c.AnalyticsComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/products/products.component').then((c) => c.ProductsComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/orders/orders.component').then((c) => c.OrdersComponent),
      },
      {
        path: '',
        redirectTo: 'analytics',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'shop',
    canActivate: [authGuard],
    loadComponent: () => import('./shop/shop.component').then((c) => c.ShopComponent),
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
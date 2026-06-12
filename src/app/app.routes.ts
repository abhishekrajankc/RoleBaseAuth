import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/pages/login.component').then((c) => c.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/pages/admin/admin.component').then((c) => c.AdminComponent),
    children: [
      { path: 'analytics', loadComponent: () => import('./features/admin/pages/analytics/analytics.component').then((c) => c.AnalyticsComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/pages/products/products.component').then((c) => c.ProductsComponent) },
      { path: 'orders', loadComponent: () => import('./features/admin/pages/orders/orders.component').then((c) => c.OrdersComponent) },
      { path: '', redirectTo: 'analytics', pathMatch: 'full' },
    ],
  },
  {
    path: 'shop',
    canActivate: [authGuard],
    loadChildren: () => import('./features/shop/shop.routes').then((m) => m.SHOP_ROUTES),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
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
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { CartsResponse, Cart, Product, ProductsResponse, User, UsersResponse } from './models';

const BASE = 'https://dummyjson.com';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  /** All products loaded from API */
  private readonly allProducts = signal<Product[]>([]);
  readonly products = this.allProducts.asReadonly();

  /** All carts loaded from API */
  private readonly allCarts = signal<Cart[]>([]);
  readonly carts = this.allCarts.asReadonly();

  /** Resolved user names keyed by userId */
  private readonly userMap = signal<Record<number, string>>({});
  readonly users = this.userMap.asReadonly();

  /** Loading states */
  readonly loadingProducts = signal(false);
  readonly loadingCarts = signal(false);
  readonly loadingUsers = signal(false);

  /** Fetch all products */
  fetchAllProducts(): Observable<Product[]> {
    this.loadingProducts.set(true);
    return this.http.get<ProductsResponse>(`${BASE}/products?limit=0`).pipe(
      map((r) => r.products),
      tap((p) => { this.allProducts.set(p); this.loadingProducts.set(false); }),
    );
  }

  /** Search products */
  searchProducts(query: string): Observable<Product[]> {
    this.loadingProducts.set(true);
    return this.http.get<ProductsResponse>(`${BASE}/products/search?q=${query}`).pipe(
      map((r) => r.products),
      tap((p) => { this.allProducts.set(p); this.loadingProducts.set(false); }),
    );
  }

  /** Get products by category */
  productsByCategory(category: string): Observable<Product[]> {
    this.loadingProducts.set(true);
    return this.http.get<ProductsResponse>(`${BASE}/products/category/${category}`).pipe(
      map((r) => r.products),
      tap((p) => { this.allProducts.set(p); this.loadingProducts.set(false); }),
    );
  }

  /** Get all categories */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${BASE}/products/category-list`);
  }

  /** Fetch all carts */
  fetchAllCarts(): Observable<Cart[]> {
    this.loadingCarts.set(true);
    return this.http.get<CartsResponse>(`${BASE}/carts?limit=0`).pipe(
      map((r) => r.carts),
      tap((c) => { this.allCarts.set(c); this.loadingCarts.set(false); }),
    );
  }

  /** Fetch users map for order display */
  fetchUserMap(): Observable<Record<number, string>> {
    this.loadingUsers.set(true);
    return this.http.get<UsersResponse>(`${BASE}/users?limit=0`).pipe(
      map((r) => {
        const map: Record<number, string> = {};
        r.users.forEach((u) => { map[u.id] = `${u.firstName} ${u.lastName}`; });
        return map;
      }),
      tap((m) => { this.userMap.set(m); this.loadingUsers.set(false); }),
    );
  }
}
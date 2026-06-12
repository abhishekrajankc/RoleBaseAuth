import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { CartsResponse, Cart, Product, ProductsResponse, UsersResponse } from '../../shared/models';

const BASE = 'https://dummyjson.com';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  // ---- Product state ----
  private readonly productsSignal = signal<Product[]>([]);
  readonly products = this.productsSignal.asReadonly();

  private readonly totalProductsSignal = signal(0);
  readonly totalProductsCount = this.totalProductsSignal.asReadonly();

  readonly loadingProducts = signal(false);

  // ---- Stock update stream (simulated WebSocket) ----
  private readonly stockUpdateSubject = new Subject<{ productId: number; newStock: number }>();
  readonly stockUpdates$ = this.stockUpdateSubject.asObservable();

  private stockInterval?: ReturnType<typeof setInterval>;

  /** Start simulating stock changes at the given interval (ms) */
  startStockSimulation(intervalMs = 5000): void {
    this.stopStockSimulation();
    this.stockInterval = setInterval(() => {
      const products = this.productsSignal();
      if (products.length === 0) return;
      const idx = Math.floor(Math.random() * products.length);
      const product = products[idx];
      const delta = Math.floor(Math.random() * 5) + 1;
      const newStock = Math.max(0, product.stock + (Math.random() > 0.5 ? delta : -delta));
      // Update the signal
      this.productsSignal.update((list) =>
        list.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
      );
      // Push to the subject for reactive badge updates
      this.stockUpdateSubject.next({ productId: product.id, newStock });
    }, intervalMs);
  }

  stopStockSimulation(): void {
    if (this.stockInterval) {
      clearInterval(this.stockInterval);
      this.stockInterval = undefined;
    }
  }

  // ---- Carts ----
  private readonly cartsSignal = signal<Cart[]>([]);
  readonly carts = this.cartsSignal.asReadonly();
  readonly loadingCarts = signal(false);

  // ---- User map ----
  private readonly userMapSignal = signal<Record<number, string>>({});
  readonly users = this.userMapSignal.asReadonly();
  readonly loadingUsers = signal(false);

  // ---- Toast notifications ----
  private readonly toastSubject = new Subject<{ message: string; type: 'success' | 'error' }>();
  readonly toast$ = this.toastSubject.asObservable();

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastSubject.next({ message, type });
  }

  // ==================== API METHODS ====================

  /** Fetch paginated products with optional search */
  fetchProducts(skip: number, limit: number, search?: string): Observable<ProductsResponse> {
    this.loadingProducts.set(true);
    const url = search
      ? `${BASE}/products/search?q=${search}&skip=${skip}&limit=${limit}`
      : `${BASE}/products?skip=${skip}&limit=${limit}`;
    return this.http.get<ProductsResponse>(url).pipe(
      tap((r) => {
        this.productsSignal.set(r.products);
        this.totalProductsSignal.set(r.total);
        this.loadingProducts.set(false);
      })
    );
  }

  /** Get a single product by ID */
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${BASE}/products/${id}`);
  }

  /** Update a product (PUT) */
  updateProduct(id: number, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${BASE}/products/${id}`, data).pipe(
      tap(() => {
        // Update local signal
        this.productsSignal.update((list) =>
          list.map((p) => (p.id === id ? { ...p, ...data } : p))
        );
        this.showToast('Product updated successfully.', 'success');
      })
    );
  }

  /** Add a new product (POST) */
  addProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${BASE}/products/add`, data).pipe(
      tap((newProduct) => {
        // Prepend locally
        this.productsSignal.update((list) => [newProduct, ...list]);
        this.totalProductsSignal.update((t) => t + 1);
        this.showToast('Product added successfully.', 'success');
      })
    );
  }

  /** Delete a product with optimistic UI: removes immediately, rolls back on error */
  deleteProduct(id: number): void {
    const previous = this.productsSignal();
    // Optimistic remove
    this.productsSignal.update((list) => list.filter((p) => p.id !== id));
    this.totalProductsSignal.update((t) => t - 1);

    this.http.delete<Product>(`${BASE}/products/${id}`).subscribe({
      error: () => {
        // Rollback
        this.productsSignal.set(previous);
        this.totalProductsSignal.update((t) => t + 1);
        this.showToast('Failed to delete product. Changes reverted.', 'error');
      },
      complete: () => {
        this.showToast('Product deleted.', 'success');
      },
    });
  }

  /** Get categories */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${BASE}/products/category-list`);
  }

  /** Fetch carts */
  fetchCarts(): Observable<Cart[]> {
    this.loadingCarts.set(true);
    return this.http.get<CartsResponse>(`${BASE}/carts?limit=0`).pipe(
      map((r) => r.carts),
      tap((c) => { this.cartsSignal.set(c); this.loadingCarts.set(false); })
    );
  }

  /** Fetch user name map */
  fetchUserMap(): Observable<Record<number, string>> {
    this.loadingUsers.set(true);
    return this.http.get<UsersResponse>(`${BASE}/users?limit=0`).pipe(
      map((r) => {
        const map: Record<number, string> = {};
        r.users.forEach((u: { id: number; firstName: string; lastName: string }) => { map[u.id] = `${u.firstName} ${u.lastName}`; });
        return map;
      }),
      tap((m) => { this.userMapSignal.set(m); this.loadingUsers.set(false); })
    );
  }
}
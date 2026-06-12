import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, map, Observable, Subject, tap } from 'rxjs';
import { Cart, CartsResponse, Product, ProductsResponse, UsersResponse } from '../../shared/models';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export interface OrderWithStatus extends Cart {
  status: OrderStatus;
  date: string;
}

const BASE = 'https://dummyjson.com';

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly http = inject(HttpClient);

  // ---- Products ----
  private readonly productsState = signal<Product[]>([]);
  readonly products = this.productsState.asReadonly();
  private readonly totalProductsState = signal(0);
  readonly totalProductsCount = this.totalProductsState.asReadonly();
  readonly loadingProducts = signal(false);

  // ---- Orders ----
  private readonly ordersState = signal<OrderWithStatus[]>([]);
  readonly orders = this.ordersState.asReadonly();
  readonly loadingOrders = signal(false);
  private readonly totalOrdersCountState = signal(0);
  readonly totalOrdersCount = this.totalOrdersCountState.asReadonly();

  // ---- Users ----
  private readonly userMapState = signal<Record<number, string>>({});
  readonly userMap = this.userMapState.asReadonly();
  readonly loadingUsers = signal(false);

  // ---- Toast ----
  readonly toast$ = new Subject<{ message: string; type: 'success' | 'error' }>();

  // ---- Stock simulation ----
  private readonly stockSubject = new Subject<{ productId: number; newStock: number }>();
  readonly stock$ = this.stockSubject.asObservable();
  private stockTimer?: ReturnType<typeof setInterval>;

  // ==================== Products ====================

  fetchProducts(skip: number, limit: number, search?: string): Observable<ProductsResponse> {
    this.loadingProducts.set(true);
    const url = search
      ? `${BASE}/products/search?q=${search}&skip=${skip}&limit=${limit}`
      : `${BASE}/products?skip=${skip}&limit=${limit}`;
    return this.http.get<ProductsResponse>(url).pipe(
      tap((r) => {
        this.productsState.set(r.products);
        this.totalProductsState.set(r.total);
        this.loadingProducts.set(false);
      })
    );
  }

  updateProduct(id: number, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${BASE}/products/${id}`, data).pipe(
      tap(() => {
        this.productsState.update((list) => list.map((p) => (p.id === id ? { ...p, ...data } : p)));
        this.toast('Product updated.', 'success');
      })
    );
  }

  addProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${BASE}/products/add`, data).pipe(
      tap((p) => {
        this.productsState.update((list) => [p, ...list]);
        this.totalProductsState.update((t) => t + 1);
        this.toast('Product added.', 'success');
      })
    );
  }

  deleteProduct(id: number): void {
    const prev = this.productsState();
    this.productsState.update((list) => list.filter((p) => p.id !== id));
    this.totalProductsState.update((t) => t - 1);
    this.http.delete<Product>(`${BASE}/products/${id}`).subscribe({
      error: () => {
        this.productsState.set(prev);
        this.totalProductsState.update((t) => t + 1);
        this.toast('Delete failed. Reverted.', 'error');
      },
      complete: () => this.toast('Product deleted.', 'success'),
    });
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${BASE}/products/category-list`);
  }

  // ==================== Orders ====================

  fetchOrders(): Observable<OrderWithStatus[]> {
    this.loadingOrders.set(true);
    return this.http.get<CartsResponse>(`${BASE}/carts?limit=0`).pipe(
      map((r) =>
        r.carts.map((c) => ({
          ...c,
          status: this.getStoredStatus(c.id),
          date: this.randomDate(c.id),
        }))
      ),
      tap((orders) => {
        this.ordersState.set(orders);
        this.totalOrdersCountState.set(orders.length);
        this.loadingOrders.set(false);
      })
    );
  }

  updateOrderStatus(orderId: number, status: OrderStatus): void {
    // Persist to localStorage so it survives page refreshes
    const key = `order-status-${orderId}`;
    localStorage.setItem(key, status);
    // Update signal immediately — shared state, no page reload
    this.ordersState.update((list) =>
      list.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    this.toast(`Order #${orderId} status → ${status}`, 'success');
  }

  private getStoredStatus(orderId: number): OrderStatus {
    const stored = localStorage.getItem(`order-status-${orderId}`);
    if (stored === 'Pending' || stored === 'Confirmed' || stored === 'Cancelled') return stored;
    // Default status based on order ID parity
    return orderId % 3 === 0 ? 'Pending' : orderId % 3 === 1 ? 'Confirmed' : 'Cancelled';
  }

  private randomDate(orderId: number): string {
    // Deterministic date based on orderId so it's stable
    const d = new Date(2025, 0, 1);
    d.setDate(d.getDate() + (orderId % 365));
    return d.toISOString().split('T')[0];
  }

  // ==================== Users ====================

  fetchUsers(): Observable<Record<number, string>> {
    this.loadingUsers.set(true);
    return this.http.get<UsersResponse>(`${BASE}/users?limit=0`).pipe(
      map((r) => {
        const m: Record<number, string> = {};
        r.users.forEach((u) => { m[u.id] = `${u.firstName} ${u.lastName}`; });
        return m;
      }),
      tap((m) => { this.userMapState.set(m); this.loadingUsers.set(false); })
    );
  }

  // ==================== Stock Simulation ====================

  startStockSimulation(ms = 5000): void {
    this.stopStockSimulation();
    this.stockTimer = setInterval(() => {
      const list = this.productsState();
      if (!list.length) return;
      const idx = Math.floor(Math.random() * list.length);
      const p = list[idx];
      const delta = Math.floor(Math.random() * 5) + 1;
      const newStock = Math.max(0, p.stock + (Math.random() > 0.5 ? delta : -delta));
      this.productsState.update((arr) => arr.map((x) => (x.id === p.id ? { ...x, stock: newStock } : x)));
      this.stockSubject.next({ productId: p.id, newStock });
    }, ms);
  }

  stopStockSimulation(): void {
    if (this.stockTimer) { clearInterval(this.stockTimer); this.stockTimer = undefined; }
  }

  // ==================== Utility ====================

  private toast(msg: string, type: 'success' | 'error'): void {
    this.toast$.next({ message: msg, type });
  }
}
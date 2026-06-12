import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {  DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminStore } from '../../../../core/store/admin.store';
import { AuthService } from '../../../../core/auth/auth.service';
import { Product } from '../../../../shared/models';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { FormsModule } from '@angular/forms';
import { PerformanceTrackerService } from '../../../../shared/services/tracker.service';

@Component({
  selector: 'app-shop',
  imports: [ProductCardComponent, DecimalPipe, FormsModule],
  templateUrl: './shop.component.html',
})
export class ShopComponent implements OnInit, OnDestroy {
  private readonly store = inject(AdminStore);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private perfTracker = inject(PerformanceTrackerService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.perfTracker.startTracking();
  }

  // Products
  readonly products = signal<Product[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Pagination
  readonly currentPage = signal(0);
  readonly pageSize = 12;

  // Filters
  readonly categories = signal<string[]>([]);
  readonly selectedCategories = signal<Set<string>>(new Set());
  readonly priceMin = signal(0);
  readonly priceMax = signal(10000);
  readonly priceRange = signal(10000);
  readonly inStockOnly = signal(false);

  // Detail
  readonly selectedProduct = signal<Product | null>(null);

   

  ngOnInit(): void {
    // Subscribe to shared stock stream from AdminStore
    this.store.stock$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ productId, newStock }) => {
      this.products.update((list) =>
        list.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );
    });

    // Load categories
    this.store.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((c) => this.categories.set(c));

    // Restore filters from URL query params
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const cats = params['categories'];
      if (cats) this.selectedCategories.set(new Set(cats.split(',')));
      if (params['price']) this.priceRange.set(+params['price']);
      if (params['inStock']) this.inStockOnly.set(params['inStock'] === 'true');
      if (params['page']) this.currentPage.set(+params['page']);
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    const skip = this.currentPage() * this.pageSize;
    this.store.fetchProducts(skip, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.products.set(r.products);
          this.totalCount.set(r.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Failed to load products. Please try again.');
        },
      });
  }

  retry(): void {
    this.loadProducts();
  }

  // ---- Filter toggles ----
  toggleCategory(cat: string): void {
    this.selectedCategories.update((s) => {
      const next = new Set(s);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    this.currentPage.set(0);
    this.syncUrl();
  }

  onPriceChange(event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    this.priceRange.set(val);
    this.currentPage.set(0);
    this.syncUrl();
  }

  toggleInStock(): void {
    this.inStockOnly.update((v) => !v);
    this.currentPage.set(0);
    this.syncUrl();
  }

  private syncUrl(): void {
    const q: Record<string, string> = {};
    if (this.selectedCategories().size) q['categories'] = [...this.selectedCategories()].join(',');
    if (this.priceRange() < 2000) q['price'] = String(this.priceRange());
    if (this.inStockOnly()) q['inStock'] = 'true';
    if (this.currentPage() > 0) q['page'] = String(this.currentPage());
    this.router.navigate([], { queryParams: q, replaceUrl: true });
  }

  // ---- Filtered products (client-side composition) ----
  get filteredProducts(): Product[] {
    let list = this.products();

    const cats = this.selectedCategories();
    if (cats.size) list = list.filter((p) => cats.has(p.category));

    const maxPrice = this.priceRange();
    list = list.filter((p) => p.price <= maxPrice);

    if (this.inStockOnly()) list = list.filter((p) => p.stock > 0);

    return list;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  loadPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage.set(page);
    this.syncUrl();
  }

  // ---- Navigate to detail ----
  openDetail(productId: number): void {
    this.router.navigate(['/shop/products', productId]);
  }
  ngOnDestroy() {
    this.perfTracker.stopTracking();
  }
}

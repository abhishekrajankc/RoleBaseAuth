import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { Cart, Product } from './models';

type Tab = 'products' | 'orders' | 'analytics';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private readonly admin = inject(AdminService);
  protected readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeTab = signal<Tab>('analytics');
  readonly searchQuery = signal('');
  readonly categories = signal<string[]>([]);
  readonly allTabs: Tab[] = ['analytics', 'products', 'orders'];
  readonly selectedCategory = signal<string | null>(null);

  // Expose signals from service
  readonly products = this.admin.products;
  readonly carts = this.admin.carts;
  readonly userMap = this.admin.users;
  readonly loadingProducts = this.admin.loadingProducts;
  readonly loadingCarts = this.admin.loadingCarts;
  readonly loadingUsers = this.admin.loadingUsers;

  // Analytics computed data
  readonly totalProducts = signal(0);
  readonly totalRevenue = signal(0);
  readonly totalOrders = signal(0);
  readonly avgRating = signal(0);
  readonly lowStockItems = signal(0);
  readonly topCategory = signal('');

  ngOnInit(): void {
    // Fetch initial data — service methods update signals internally via tap
    this.admin
      .fetchAllProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => this.computeProductAnalytics(p));

    this.admin
      .fetchAllCarts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((c) => this.computeCartAnalytics(c));

    this.admin
      .fetchUserMap()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.admin
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((c) => this.categories.set(c));
  }

  private computeProductAnalytics(products: Product[]): void {
    this.totalProducts.set(products.length);
    const avg = products.reduce((s, x) => s + x.rating, 0) / (products.length || 1);
    this.avgRating.set(Math.round(avg * 100) / 100);
    this.lowStockItems.set(products.filter((x) => x.stock < 10).length);

    const cats: Record<string, number> = {};
    products.forEach((x) => {
      cats[x.category] = (cats[x.category] || 0) + 1;
    });
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    this.topCategory.set(top ? top[0] : '');
  }

  private computeCartAnalytics(carts: Cart[]): void {
    this.totalOrders.set(carts.length);
    this.totalRevenue.set(carts.reduce((s, x) => s + x.total, 0));
  }

  switchTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.selectedCategory.set(null);
    if (query.trim()) {
      this.admin.searchProducts(query.trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    } else {
      this.admin.fetchAllProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  filterByCategory(cat: string | ''): void {
    this.selectedCategory.set(cat);
    this.searchQuery.set('');
    if (cat) {
      this.admin.productsByCategory(cat).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    } else {
      this.admin.fetchAllProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.searchQuery.set('');
    this.admin.fetchAllProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  getUserName(userId: number): string {
    return this.userMap()[userId] ?? `User #${userId}`;
  }

  get totalDiscounted(): number {
    return this.admin.carts().reduce((s, x) => s + x.discountedTotal, 0);
  }

  get totalSavings(): number {
    return this.totalRevenue() - this.totalDiscounted;
  }
}
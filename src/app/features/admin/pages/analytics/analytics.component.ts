import { Component, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { AdminStore } from '../../../../core/store/admin.store';
import { AuthService } from '../../../../core/auth/auth.service';
import { Product } from '../../../../shared/models';
import { DestroyRef, signal } from '@angular/core';

@Component({
  selector: 'app-analytics',
  imports: [CurrencyPipe],
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent implements OnInit {
  readonly store = inject(AdminStore);
  protected readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly totalOrders = signal(0);
  readonly totalRevenue = signal(0);
  readonly avgRating = signal(0);
  readonly lowStockItems = signal(0);
  readonly topCategory = signal('');

  protected readonly totalDiscounted = computed(() => {
    return this.store.orders().reduce((s, x) => s + x.discountedTotal, 0);
  });
  protected readonly totalSavings = computed(() => {
    return this.totalRevenue() - this.totalDiscounted();
  });
  ngOnInit(): void {
    this.store.fetchProducts(0, 10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => this.compute(r.products));

    this.store.fetchOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orders) => {
        this.totalOrders.set(orders.length);
        this.totalRevenue.set(orders.reduce((s, o) => s + o.total, 0));
      });

    this.store.fetchUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private compute(products: Product[]): void {
    const avg = products.reduce((s, x) => s + x.rating, 0) / (products.length || 1);
    this.avgRating.set(Math.round(avg * 100) / 100);
    this.lowStockItems.set(products.filter((x) => x.stock < 10).length);
    const cats: Record<string, number> = {};
    products.forEach((x) => { cats[x.category] = (cats[x.category] || 0) + 1; });
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    this.topCategory.set(top ? top[0] : '');
  }

  
}

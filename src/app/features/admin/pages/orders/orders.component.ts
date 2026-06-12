import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStore } from '../../../../core/store/admin.store';
import { OrderWithStatus } from '../../../../shared/models';

type StatusFilter = 'All' | 'Pending' | 'Confirmed' | 'Cancelled';

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, FormsModule, NgOptimizedImage],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  readonly store = inject(AdminStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusFilter = signal<StatusFilter>('All');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly currentPage = signal(0);
  readonly pageSize = 10;

  readonly sortField = signal<'id' | 'date' | 'total' | 'status'>('id');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  // Side panel
  readonly selectedOrder = signal<OrderWithStatus | null>(null);

  public filteredOrders = computed(() => {
    const rawOrders = this.store.orders();
    const sf = this.statusFilter();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (!rawOrders.length) return [];

    return rawOrders.filter((o) => {
      if (sf !== 'All' && o.status !== sf) return false;
      if (from && o.date < from) return false;
      if (to && o.date > to) return false;
      return true;
    });
  });
  
  public totalFiltered = computed(() => this.filteredOrders().length);

  public pagedOrders = computed(() => {
    const list = [...this.filteredOrders()]; // Reads directly from the cached filter step!
    const field = this.sortField();
    const dir = this.sortDir();
    const page = this.currentPage();

    if (!list.length) return [];

    // Sort
    list.sort((a: any, b: any) => {
      const valA = field === 'date' || field === 'status' ? a[field] : +a[field];
      const valB = field === 'date' || field === 'status' ? b[field] : +b[field];

      if (typeof valA === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return dir === 'asc' ? valA - valB : valB - valA;
    });

    // Slice
    const start = page * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });
  public totalPages = computed(() => {
    return Math.ceil(this.totalFiltered() / this.pageSize);
  });
  public pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  });


  ngOnInit(): void {
    this.store.fetchOrders().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.store.fetchUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  getUserName(userId: number): string {
    return this.store.userMap()[userId] ?? `User #${userId}`;
  }

  getProductNames(order: OrderWithStatus): string {
    return order.products.map((p) => p.title).join(', ');
  }

  toggleSort(field: 'id' | 'date' | 'total' | 'status'): void {
    if (this.sortField() === field) this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { this.sortField.set(field); this.sortDir.set('asc'); }
  }

  getSortIndicator(field: string): string {
    if (this.sortField() !== field) return '';
    return this.sortDir() === 'asc' ? ' ▲' : ' ▼';
  }

  loadPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
  }

  // ---- Side panel ----
  openDetail(order: OrderWithStatus): void {
    this.selectedOrder.set(order);
  }

  closeDetail(): void {
    this.selectedOrder.set(null);
  }

  updateStatus(orderId: number, status: string): void {
    if (status === 'Pending' || status === 'Confirmed' || status === 'Cancelled') {
      this.store.updateOrderStatus(orderId, status);
      // Side panel also updates reactively since it reads from store.orders
    }
  }
}

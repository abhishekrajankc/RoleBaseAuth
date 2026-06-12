import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStore } from '../../../../core/store/admin.store';
import { OrderWithStatus } from '../../../../shared/models';

type StatusFilter = 'All' | 'Pending' | 'Confirmed' | 'Cancelled';

@Component({
  selector: 'app-orders',
  standalone: true,
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

  // ---- Filtering ----
  get filteredOrders(): OrderWithStatus[] {
    let list = [...this.store.orders()];

    // Status filter
    const sf = this.statusFilter();
    if (sf !== 'All') list = list.filter((o) => o.status === sf);

    // Date range
    const from = this.dateFrom();
    const to = this.dateTo();
    if (from) list = list.filter((o) => o.date >= from);
    if (to) list = list.filter((o) => o.date <= to);

    return list;
  }

  get totalFiltered(): number {
    return this.filteredOrders.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalFiltered / this.pageSize);
  }

  get pagedOrders(): OrderWithStatus[] {
    // Sort
    const field = this.sortField();
    const dir = this.sortDir();
    const sorted = [...this.filteredOrders].sort((a, b) => {
      if (field === 'id') return dir === 'asc' ? a.id - b.id : b.id - a.id;
      if (field === 'total') return dir === 'asc' ? a.total - b.total : b.total - a.total;
      if (field === 'date') return dir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      if (field === 'status') return dir === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      return 0;
    });

    const start = this.currentPage() * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
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
    if (page < 0 || page >= this.totalPages) return;
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
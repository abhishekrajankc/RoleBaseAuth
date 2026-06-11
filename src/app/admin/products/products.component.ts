import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AdminStore } from '../admin.store';
import { Product, SortDir, SortField } from '../models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
  readonly store = inject(AdminStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery = signal('');
  readonly categories = signal<string[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly sortField = signal<SortField>('title');
  readonly sortDir = signal<SortDir>('asc');
  readonly currentPage = signal(0);
  readonly pageSize = 10;

  // Modal
  readonly showModal = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly formData = signal({ title: '', description: '', category: '', price: 0, stock: 0, brand: '' });

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadPage(0);
    this.store.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((c) => this.categories.set(c));
    this.store.stock$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.store.startStockSimulation(5000);

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => { this.currentPage.set(0); return this.store.fetchProducts(0, this.pageSize, q || undefined); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  filterByCategory(cat: string | null): void {
    this.selectedCategory.set(cat);
    this.currentPage.set(0);
    this.loadPage(0);
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.searchQuery.set('');
    this.currentPage.set(0);
    this.loadPage(0);
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { this.sortField.set(field); this.sortDir.set('asc'); }
  }

  getSortIndicator(field: SortField): string {
    if (this.sortField() !== field) return '';
    return this.sortDir() === 'asc' ? ' ▲' : ' ▼';
  }

  get sortedProducts(): Product[] {
    let list = [...this.store.products()];
    const cat = this.selectedCategory();
    if (cat) list = list.filter((p) => p.category === cat);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    const field = this.sortField();
    const dir = this.sortDir();
    list.sort((a, b) => {
      const aV = a[field]; const bV = b[field];
      if (typeof aV === 'string' && typeof bV === 'string') return dir === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
      return dir === 'asc' ? (aV as number) - (bV as number) : (bV as number) - (aV as number);
    });
    return list;
  }

  get totalPages(): number { return Math.ceil(this.store.totalProductsCount() / this.pageSize); }

  loadPage(page: number): void {
    this.currentPage.set(page);
    this.store.fetchProducts(page * this.pageSize, this.pageSize, this.searchQuery().trim() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  openAddModal(): void { this.editingProduct.set(null); this.formData.set({ title: '', description: '', category: '', price: 0, stock: 0, brand: '' }); this.showModal.set(true); }
  openEditModal(p: Product): void { this.editingProduct.set(p); this.formData.set({ title: p.title, description: p.description, category: p.category, price: p.price, stock: p.stock, brand: p.brand }); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); this.editingProduct.set(null); }

  submitForm(): void {
    const data = this.formData();
    if (this.editingProduct()) {
      this.store.updateProduct(this.editingProduct()!.id, data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.closeModal());
    } else {
      this.store.addProduct(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.closeModal());
    }
  }

  deleteProduct(id: number): void { this.store.deleteProduct(id); }
}
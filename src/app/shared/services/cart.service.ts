import { Injectable, signal } from '@angular/core';
import { Product } from '../models';

export interface CartItem {
  product: Product;
  quantity: number;
}

const STORAGE_KEY = 'shop_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(this.load());

  readonly items = this.itemsSignal.asReadonly();
  readonly count = signal(this.itemsSignal().reduce((s, i) => s + i.quantity, 0));

  add(product: Product, quantity = 1): void {
    this.itemsSignal.update((list) => {
      const existing = list.find((i) => i.product.id === product.id);
      if (existing) {
        return list.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i
        );
      }
      return [...list, { product, quantity }];
    });
    this.persist();
  }

  updateQuantity(productId: number, quantity: number): void {
    this.itemsSignal.update((list) =>
      list.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
    this.persist();
  }

  remove(productId: number): void {
    this.itemsSignal.update((list) => list.filter((i) => i.product.id !== productId));
    this.persist();
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.count.set(0);
    localStorage.removeItem(STORAGE_KEY);
  }

  private persist(): void {
    const items = this.itemsSignal();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    this.count.set(items.reduce((s, i) => s + i.quantity, 0));
  }

  private load(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }
}
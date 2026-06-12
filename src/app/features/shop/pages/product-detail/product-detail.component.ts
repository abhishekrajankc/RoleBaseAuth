import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';
import { Product } from '../../../../shared/models';
import { AdminStore } from '../../../../core/store/admin.store';
import { CartService } from '../../../../shared/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink, NgOptimizedImage],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly store = inject(AdminStore);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);

  /** Product resolved by the route resolver — guaranteed to exist at this point */
  readonly product = this.route.snapshot.data['product'] as Product;

  /** Quantity selector */
  readonly quantity = signal(1);

  /** Related products from the same category */
  readonly relatedProducts = toSignal(
    this.http
      .get<{ products: Product[] }>(
        `https://dummyjson.com/products/category/${this.product.category}?limit=5`
      )
      .pipe(
        map((r) => r.products.filter((p) => p.id !== this.product.id).slice(0, 4)),
      ),
    { initialValue: [] as Product[] },
  );

  protected readonly inStock = signal(this.product.stock > 0);

  protected increaseQty(): void {
    this.quantity.update((q) => Math.min(q + 1, this.product.stock));
  }

  protected decreaseQty(): void {
    this.quantity.update((q) => Math.max(q - 1, 1));
  }

  readonly addedMessage = signal<string | null>(null);

  protected addToCart(): void {
    this.cart.add(this.product, this.quantity());
    this.addedMessage.set(`Added ${this.quantity()} × ${this.product.title} to cart!`);
    this.quantity.set(1);
    setTimeout(() => this.addedMessage.set(null), 4000);
  }

  protected goToCart(): void {
    this.router.navigate(['/shop/checkout/step/1']);
  }

  protected notifyMe(): void {
    alert(`You'll be notified when ${this.product.title} is back in stock.`);
  }
}
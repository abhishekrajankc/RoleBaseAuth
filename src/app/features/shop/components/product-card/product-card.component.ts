/**
 * ProductCardComponent uses OnPush change detection.
 *
 * OnPush is justified here because:
 * 1. The card receives all dynamic data via inputs (product object). No internal
 *    state changes trigger change detection unless the input reference changes.
 * 2. The live stock badge updates reactively via the shared stock$ stream from
 *    AdminStore, which mutates the product object's stock property in-place.
 *    Using OnPush means only cards whose stock actually changed will be re-rendered.
 * 3. This avoids unnecessary CD cycles across the entire product grid when only
 *    a single product's stock changes via the simulated WebSocket.
 */
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Product } from '../../../../shared/models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, NgOptimizedImage],
  templateUrl: './product-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly viewDetail = output<number>();

  protected get stockLabel(): string {
    const s = this.product().stock;
    if (s === 0) return 'Out of stock';
    if (s < 10) return `Only ${s} left`;
    return 'In Stock';
  }

  protected get stockClass(): string {
    const s = this.product().stock;
    if (s === 0) return 'bg-red-100 text-red-700';
    if (s < 10) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  }
}
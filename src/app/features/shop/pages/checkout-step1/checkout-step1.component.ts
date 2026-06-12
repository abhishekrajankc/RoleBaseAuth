import { Component, inject } from '@angular/core';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../../shared/services/cart.service';
import { CartTotalPipe } from '../../../../shared/pipes/cart-total.pipe';
import { markStepComplete } from '../../guards/checkout-step.guard';

@Component({
  selector: 'app-checkout-step1',
  imports: [CurrencyPipe, CartTotalPipe, RouterLink, NgOptimizedImage],
  templateUrl: './checkout-step1.component.html',
})
export class CheckoutStep1Component {
  readonly cart = inject(CartService);
  readonly taxRate = 0.08;

  updateQty(productId: number, qty: number): void {
    if (qty < 1) return;
    this.cart.updateQuantity(productId, qty);
  }

  remove(productId: number): void {
    this.cart.remove(productId);
  }

  proceed(): void {
    markStepComplete(1);
  }
}

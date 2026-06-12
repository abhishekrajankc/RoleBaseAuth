import { Pipe, PipeTransform } from '@angular/core';
import { CartItem } from '../services/cart.service';

export interface CartTotals {
  subtotal: number;
  tax: number;
  grandTotal: number;
}

@Pipe({
  name: 'cartTotal',
})
export class CartTotalPipe implements PipeTransform {
  transform(items: CartItem[], taxRate?: number): CartTotals {
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const tax = taxRate ? subtotal * taxRate : 0;
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
  }
}

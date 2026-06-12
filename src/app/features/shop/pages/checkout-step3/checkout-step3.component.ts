import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../../../shared/services/cart.service';
import { CardInputComponent } from '../../../../shared/components/card-input/card-input.component';
import { CartTotalPipe } from '../../../../shared/pipes/cart-total.pipe';
import { markStepComplete, clearCheckoutProgress } from '../../guards/checkout-step.guard';
import { FieldConfig } from '../../../../shared/components/form-field/form-field.component';

@Component({
  selector: 'app-checkout-step3',
  standalone: true,
  imports: [ReactiveFormsModule, CardInputComponent, CurrencyPipe, CartTotalPipe, RouterLink],
  templateUrl: './checkout-step3.component.html',
})
export class CheckoutStep3Component {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly cart = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);

  readonly billingFields = signal<FieldConfig[]>([]);
  readonly sameAsDelivery = signal(true);
  readonly taxRate = 0.08;
  readonly submitting = signal(false);
  readonly orderConfirmed = signal(false);

  readonly form = this.fb.group({
    cardNumber: ['', [Validators.required]],
    cardName: ['', [Validators.required]],
    expiry: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])/[0-9]{2}$')]],
    cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]],
    billingFullName: [''],
    billingAddressLine1: [''],
    billingAddressLine2: [''],
    billingCity: [''],
    billingState: [''],
    billingZipCode: [''],
    billingCountry: [''],
  });

  constructor() {
    // Load billing fields config
    this.http
      .get<{ fields: FieldConfig[] }>('/checkout-form.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cfg) => {
        this.billingFields.set(
          cfg.fields.map((f) => ({
            ...f,
            key: 'billing' + f.key.charAt(0).toUpperCase() + f.key.slice(1),
          }))
        );
      });
  }

  toggleBilling(): void {
    this.sameAsDelivery.update((v) => !v);
  }

  isFieldHidden(field: FieldConfig): boolean {
    return this.sameAsDelivery();
  }

  submitOrder(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach((k) => this.form.get(k)?.markAsTouched());
      return;
    }

    this.submitting.set(true);

    // Optimistic: show confirmed immediately
    this.orderConfirmed.set(true);

    const orderPayload = {
      userId: 1,
      products: this.cart.items().map((i) => ({
        id: i.product.id,
        quantity: i.quantity,
      })),
    };

    this.http
      .post<{ id: number }>('https://dummyjson.com/carts/add', orderPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.cart.clear();
          clearCheckoutProgress();
          markStepComplete(3);
          this.submitting.set(false);
          this.router.navigate(['/shop/order-confirmation', res.id || Math.floor(Math.random() * 1000)]);
        },
        error: () => {
          // Roll back optimistic state
          this.orderConfirmed.set(false);
          this.submitting.set(false);
          alert('Order submission failed. Please try again.');
        },
      });
  }
}
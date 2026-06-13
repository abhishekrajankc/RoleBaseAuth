import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../../../shared/services/cart.service';
import { CardInputComponent } from '../../../../shared/components/card-input/card-input.component';
import { CartTotalPipe } from '../../../../shared/pipes/cart-total.pipe';
import { markStepComplete, clearCheckoutProgress } from '../../guards/checkout-step.guard';
import { FieldConfig, FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';

@Component({
  selector: 'app-checkout-step3',
  imports: [ReactiveFormsModule, CardInputComponent, CurrencyPipe, CartTotalPipe, RouterLink, FormFieldComponent],
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

  // 2. Map store to retain pristine JSON validators for toggling later
  private validationRegistry = new Map<string, ValidatorFn[]>();
  protected form: FormGroup = this.fb.group({
    cardNumber: ['', [Validators.required]],
    cardName: ['', [Validators.required]],
    expiry: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])/[0-9]{2}$')]],
    cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]],
  });
  constructor() {
    // 1. Fetch your dynamic billing form schema configuration
    this.http
      .get<{ fields: FieldConfig[] }>('/checkout-form.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cfg) => {
        const mappedFields = cfg.fields.map((f) => ({
          ...f,
          key: 'billing' + f.key.charAt(0).toUpperCase() + f.key.slice(1),
          placeholder: f.label
        }));

        this.billingFields.set(mappedFields);

        // 2. Add controls with their correct, initial validation states
        for (const f of mappedFields) {
          const validators = [];
          const v = f.validators || {};

          if (v['required']) validators.push(Validators.required);
          if (v['email']) validators.push(Validators.email);
          if (v['minLength']) validators.push(Validators.minLength(v['minLength'] as number));
          if (v['pattern']) validators.push(Validators.pattern(v['pattern'] as string));

          // Save pristine configuration rules to your local map registry
          this.validationRegistry.set(f.key, validators);

          // ✅ INITIAL PROTECTION: If checkbox is checked, initialize control as completely clean
          const initialValidators = this.sameAsDelivery() ? [] : validators;
          this.form.addControl(f.key, this.fb.control('', initialValidators));
        }

        // 3. Force the parent form to recalculate its status tree once all fields are loaded
        this.form.updateValueAndValidity();
      });
  }

  // 4. ✅ CONTROLLED ACTION METHOD: Triggers perfectly when the checkbox changes states
  protected toggleSameAsDelivery(checked: boolean): void {
    this.sameAsDelivery.set(checked);
    const fields = this.billingFields();

    for (const f of fields) {
      const control = this.form.get(f.key);
      if (!control) continue;

      if (checked) {
        control.clearValidators();
        control.setErrors(null);
        control.setValue('', { emitEvent: false });
      } else {
        const originalValidators = this.validationRegistry.get(f.key) || [];
        control.setValidators(originalValidators);
      }

      control.updateValueAndValidity({ emitEvent: false });
    }

    // ✅ CRITICAL STEP: Explicitly tell the parent form to update its status after the loop ends!
    this.form.updateValueAndValidity({ emitEvent: true });
  }
   

  toggleBilling(): void {
    this.sameAsDelivery.update((v) => !v);
  }

  isFieldHidden(field: FieldConfig): boolean {
    return this.sameAsDelivery();
  }
  protected getControl(key: string): FormControl {
    return this.form.get(key) as FormControl;
  }
  submitOrder(): void {
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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

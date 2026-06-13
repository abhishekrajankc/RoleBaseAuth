import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

/**
 * Custom ControlValueAccessor for credit card number input with real-time
 * Luhn algorithm validation. Integrates seamlessly into reactive forms.
 */
@Component({
  selector: 'app-card-input',
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardInputComponent),
      multi: true,
    },
  ],
  template: `
    <div>
      <label class="mb-1 block text-sm font-medium text-gray-700">Card Number</label>
      <input
        type="text"
        [value]="displayValue"
        (input)="onInput($event)"
        (blur)="onTouched()"
        placeholder="1234 5678 9012 3456"
        maxlength="19"
        class="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500"
        [class.border-red-400]="!!error && touched || !touched || !isValid && touched"
      />
      @if (error && touched && !isValid) {
        <p class="mt-1 text-xs text-red-600">{{ error }}</p>
      }
      @if (!error && !touched) {
        <p class="mt-1 text-xs text-red-600">Card Number is required</p>
      }
      @if (isValid && touched) {
        <p class="mt-1 text-xs text-green-600">Valid card number</p>
      }
      
    </div>
  `,
})
export class CardInputComponent implements ControlValueAccessor {
  displayValue = '';
  error: string | null = null;
  isValid = false;
  touched = false;

  onChange: (value: string) => void = () => {};
  onTouchedFn: () => void = () => {};

  writeValue(value: string): void {
    this.displayValue = this.format(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    this.displayValue = this.format(raw);
    this.error = this.validateLuhn(raw);
    this.isValid = raw.length === 16 && !this.error;
    this.onChange(raw);
  }

  onTouched(): void {
    this.touched = true;
    this.onTouchedFn();
  }

  private format(value: string): string {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  private validateLuhn(digits: string): string | null {
    if (digits.length === 0) return null;
    if (digits.length < 16) return 'Card number must be 16 digits';
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0 ? null : 'Invalid card number (Luhn check failed)';
  }
}

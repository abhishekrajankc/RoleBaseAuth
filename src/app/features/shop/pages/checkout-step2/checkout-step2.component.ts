import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FieldConfig, FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { markStepComplete } from '../../guards/checkout-step.guard';

@Component({
  selector: 'app-checkout-step2',
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent],
  templateUrl: './checkout-step2.component.html',
})
export class CheckoutStep2Component {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly fields: FieldConfig[] = [
    { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe', validators: { required: true, minLength: 2 } },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com', validators: { required: true, email: true } },
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 234 567 890', validators: { required: true, pattern: '^[+]?[0-9]{10,15}$' } },
    { key: 'addressLine1', label: 'Address Line 1', type: 'text', placeholder: '123 Main St', validators: { required: true } },
    { key: 'addressLine2', label: 'Address Line 2', type: 'text', placeholder: 'Apt, Suite, etc.', validators: {} },
    { key: 'city', label: 'City', type: 'text', placeholder: 'New York', validators: { required: true } },
    { key: 'state', label: 'State / Province', type: 'text', placeholder: 'NY', validators: { required: true } },
    { key: 'zipCode', label: 'ZIP / Postal Code', type: 'text', placeholder: '10001', validators: { required: true, pattern: '^[0-9]{5,6}$' } },
    { key: 'country', label: 'Country', type: 'text', placeholder: 'United States', validators: { required: true } },
    { key: 'deliveryNotes', label: 'Delivery Notes', type: 'textarea', placeholder: 'Leave at the door', validators: {} },
  ];

  private buildForm() {
    const group: Record<string, unknown> = {};
    for (const f of this.fields) {
      const validators = [];
      const v = f.validators;
      if (v['required']) validators.push(Validators.required);
      if (v['email']) validators.push(Validators.email);
      if (v['minLength']) validators.push(Validators.minLength(v['minLength'] as number));
      if (v['pattern']) validators.push(Validators.pattern(v['pattern'] as string));
      group[f.key] = ['', validators];
    }
    return group;
  }

  readonly form = this.fb.group(this.buildForm());

  protected getControl(key: string): FormControl {
    return this.form.get(key) as FormControl;
  }

  proceed(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    markStepComplete(2);
    this.router.navigate(['/shop/checkout/step/3']);
  }
}

import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

export interface ValidationRule {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  pattern?: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  validators: ValidationRule;
}

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './form-field.component.html',
   
})
export class FormFieldComponent {
  readonly field = input.required<FieldConfig>();
  readonly hidden = input(false);
}

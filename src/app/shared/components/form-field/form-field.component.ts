import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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
  readonly control = input.required<FormControl>();
  readonly hidden = input(false);

}

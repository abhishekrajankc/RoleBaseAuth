import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/users';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  // OnPush: the component only depends on signals and form state — no need
  // for the default change detection to keep polling for changes elsewhere.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.error.set(null);
    this.loading.set(true);

    const { email, password } = this.form.value as { email: string; password: string };

    this.auth.login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user: User | undefined) => {
        this.loading.set(false);

        if (!user) {
          this.error.set('Invalid email or password.');
          return;
        }

        this.auth.startSession(user);

        const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
        const defaultUrl = user.role === 'admin' ? '/admin' : '/shop';
        this.router.navigateByUrl(returnUrl || defaultUrl);
      });
  }
}
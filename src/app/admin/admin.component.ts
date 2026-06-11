import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminStore } from './admin.store';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  readonly store = inject(AdminStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error'>('success');

  readonly navLinks = [
    { path: '/admin/analytics', label: 'Analytics' },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/orders', label: 'Orders' },
  ];

  ngOnInit(): void {
    this.store.toast$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((t) => {
      this.toastMessage.set(t.message);
      this.toastType.set(t.type);
      setTimeout(() => this.toastMessage.set(null), 3000);
    });
  }
}
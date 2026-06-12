import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { delay, Observable, of } from 'rxjs';
import { findUser, User } from './users';

/**
 * Singleton auth service — single source of truth for identity.
 * Exposes currentUser, isAuthenticated, and role as Angular signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly STORAGE_KEY = 'auth_session';

  private readonly user = signal<User | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly role = computed(() => this.user()?.role ?? null);

  constructor() {
    this.restore();
  }

  /** Simulate a 600ms network call, validate credentials */
  login(email: string, password: string): Observable<User | undefined> {
    return of(findUser(email, password)).pipe(delay(600));
  }

  /** Persist session and update signals */
  startSession(user: User): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.user.set(user);
  }

  /** Clear session and navigate to login */
  logout(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  /** Rehydrate from sessionStorage on app init */
  private restore(): void {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;
    try {
      this.user.set(JSON.parse(raw) as User);
    } catch {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }

  }
}
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth';
import { CartService } from './shared/services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);

  readonly currentUser = this.auth.currentUser;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly role = this.auth.role;
  readonly cartCount = this.cart.count;

  logout(): void {
    this.auth.logout();
  }
}
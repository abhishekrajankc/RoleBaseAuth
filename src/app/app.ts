import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);

  readonly currentUser = this.auth.currentUser;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly role = this.auth.role;

  logout(): void {
    this.auth.logout();
  }
}
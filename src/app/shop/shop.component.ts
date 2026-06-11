import { Component, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [],
  templateUrl: './shop.component.html',
})
export class ShopComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
}
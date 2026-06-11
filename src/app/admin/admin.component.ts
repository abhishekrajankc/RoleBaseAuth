import { Component, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
 
 
}
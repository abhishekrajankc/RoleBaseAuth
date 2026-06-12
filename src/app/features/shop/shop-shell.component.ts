import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shop-shell',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './shop-shell.component.html',
})
export class ShopShellComponent {
  readonly skeletonCards = [1, 2, 3, 4, 5, 6, 7, 8];
}

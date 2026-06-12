import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { catchError, EMPTY, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../shared/models';

export const productResolver: ResolveFn<Product | null> = (
  route: ActivatedRouteSnapshot,
): Observable<Product | null> => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const id = route.paramMap.get('id');

  if (!id) {
    router.navigate(['/shop']);
    return EMPTY;
  }

  return http.get<Product>(`https://dummyjson.com/products/${id}`).pipe(
    catchError(() => {
      router.navigate(['/shop']);
      return EMPTY;
    }),
  );
};
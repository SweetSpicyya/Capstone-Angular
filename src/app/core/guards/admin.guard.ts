import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (user && user.role === 'admin') {
    return true;
  }

  if (user) {
    router.navigate(['/']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};

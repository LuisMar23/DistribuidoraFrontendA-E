import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../components/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401 && !req.url.includes('/auth/refresh')) {
        return authService.refreshToken().pipe(
          switchMap(newToken => {
            const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(newReq);
          }),
          catchError(_ => {
            authService.logout();
            return throwError(() => _);
          })
        );
      }
      return throwError(() => err);
    })
  );
};

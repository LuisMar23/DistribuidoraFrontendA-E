import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../components/services/auth.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = this.authService.getToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next.handle(authReq).pipe(
    catchError(err => {
      if (err.status === 401) { // token expirado
        return this.authService.refreshToken().pipe(
          switchMap(newToken => {
            const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next.handle(newReq);
          }),
          catchError(_ => {
            this.authService.logout();
            return throwError(() => _);
          })
        );
      }
      return throwError(() => err);
    })
  );
}

}

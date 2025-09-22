import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../components/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    return this.checkLogin();
  }

canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
  if (!this.auth.isLoggedIn()) {
    this.router.navigate(['/login']);
    return false;
  }
  return true;
}
  private checkLogin(): boolean {
    if (this.auth.isLoggedIn()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

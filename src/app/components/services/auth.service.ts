import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginDto } from '../../core/interfaces/login.interface';
import { RegisterDto } from '../../core/interfaces/register.interface';

export interface LoginResponse {
  data: {
    user: any;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ChangePasswordResponse {
  data: {
    message: string;
    user: {
      username: string;
      role: string;
    };
  };
}

export interface ChangePasswordDto {
  ci: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_data';

  constructor(private http: HttpClient, private router: Router) {}

  login(data: LoginDto): Observable<LoginResponse> {
    const loginData = {
      username: data.identifier,
      password: data.password,
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, loginData).pipe(
      tap((res) => {
        console.log('Login exitoso - Tokens recibidos');

        // CORRECCIÓN COMPLETA: Manejo consistente de tokens según rememberMe
        if (data.rememberMe) {
          // Guardar en localStorage (persistente)
          localStorage.setItem(this.tokenKey, res.data.accessToken);
          localStorage.setItem(this.refreshTokenKey, res.data.refreshToken);
          localStorage.setItem(this.userKey, JSON.stringify(res.data.user));

          // Limpiar sessionStorage
          sessionStorage.removeItem(this.tokenKey);
          sessionStorage.removeItem(this.refreshTokenKey);
          sessionStorage.removeItem(this.userKey);
        } else {
          // Guardar en sessionStorage (solo para la sesión)
          sessionStorage.setItem(this.tokenKey, res.data.accessToken);
          sessionStorage.setItem(this.refreshTokenKey, res.data.refreshToken);
          sessionStorage.setItem(this.userKey, JSON.stringify(res.data.user));

          // Limpiar localStorage
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.refreshTokenKey);
          localStorage.removeItem(this.userKey);
        }
      })
    );
  }

  register(data: RegisterDto): Observable<RegisterDto> {
    console.log('Registro attempt:', {
      username: data.username,
      fullName: data.fullName,
      ci: data.ci ? '***' : 'not-provided',
      telefono: data.telefono ? '***' : 'not-provided',
    });

    return this.http.post(`${this.apiUrl}/auth/register`, data).pipe(
      tap((res: any) => {
        if (res.access_token) {
          this.saveTokens(res.access_token, res.refresh_token);
        }
      })
    );
  }

  changePassword(data: ChangePasswordDto): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.apiUrl}/auth/change-password`, data).pipe(
      catchError((error) => {
        let errorMessage = 'Error al cambiar la contraseña';

        if (error.status === 404) {
          errorMessage = 'No se encontró ningún usuario con ese CI';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Datos inválidos';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  refreshToken(): Observable<string> {
    const token = this.getRefreshToken(); // CORRECCIÓN: Usar método corregido
    if (!token) {
      console.error('No hay refresh token disponible');
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${this.apiUrl}/auth/refresh`, {
        refreshToken: token,
      })
      .pipe(
        tap((res) => {
          // CORRECCIÓN: Actualizar tokens en el storage correspondiente
          if (localStorage.getItem(this.tokenKey)) {
            // Si estaba en localStorage, mantener ahí
            localStorage.setItem(this.tokenKey, res.accessToken);
            localStorage.setItem(this.refreshTokenKey, res.refreshToken);
          } else {
            // Si estaba en sessionStorage, mantener ahí
            sessionStorage.setItem(this.tokenKey, res.accessToken);
            sessionStorage.setItem(this.refreshTokenKey, res.refreshToken);
          }
        }),
        map((res) => res.accessToken),
        catchError((error) => {
          console.error('Error refreshing token:', error);
          // Si falla el refresh, hacer logout
          this.logout();
          return throwError(() => error);
        })
      );
  }

  private saveTokens(access: string, refresh: string) {
    localStorage.setItem(this.tokenKey, access);
    localStorage.setItem(this.refreshTokenKey, refresh);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    }
    return null;
  }

  // CORRECCIÓN: Método para obtener el refresh token correctamente
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem(this.refreshTokenKey) || sessionStorage.getItem(this.refreshTokenKey)
      );
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    // CORRECCIÓN: Limpiar ambos storage completamente
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);

    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.userKey);

    this.router.navigate(['/login']);
  }

  getCurrentUser(): any {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.userKey) || sessionStorage.getItem(this.userKey);

      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          return null;
        }
      }
    }
    return null;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }
  hasRole(...roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  }
}

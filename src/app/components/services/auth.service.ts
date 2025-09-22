import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginDto } from '../../core/interfaces/login.interface';
import { RegisterDto } from '../../core/interfaces/register.interface';
import { Router } from '@angular/router';



export interface LoginResponse {
  data: {
    user: any; // puedes tipar con User si quieres
    accessToken: string;
    refreshToken: string;
  };
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'access_token';
  private userKey = 'user_data';

  constructor(private http: HttpClient,private router:Router) {}

  login(data: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap((res) => {
        console.log('lo q necesito');
        console.log(res);
        localStorage.setItem(this.tokenKey, res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);
        localStorage.setItem(this.userKey, JSON.stringify(res.data.user));

        if (!data.rememberMe) {
          sessionStorage.setItem(this.tokenKey, res.data.accessToken);
          sessionStorage.setItem(this.userKey, JSON.stringify(res.data.user));
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.userKey);
        }
      })
    );
  }

  register(data: RegisterDto): Observable<RegisterDto> {
    return this.http.post(`${this.apiUrl}/auth/register`, data).pipe(
      tap((res: any) => {
        if (res.access_token) {
          this.saveTokens(res.access_token, res.refresh_token);
        }
      })
    );
  }

  refreshToken(): Observable<string> {
    const token = localStorage.getItem('refresh_token');
    if (!token) throw new Error('No hay refresh token');

    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${this.apiUrl}/auth/refresh`, {
        refreshToken: token,
      })
      .pipe(
        tap((res) => {
          // actualizar tokens en storage
          localStorage.setItem('access_token', res.accessToken);
          localStorage.setItem('refresh_token', res.refreshToken);
        }),
        map((res) => res.accessToken)
      );
  }

  // Método para recuperación de contraseña
  forgotPassword(email: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/forgot-password`, { email });
  }

  private saveTokens(access: string, refresh: string) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && localStorage) {
      return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  logout() {
 
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(this.userKey);


    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem(this.userKey);


    this.router.navigate(['/login']);
  }
}

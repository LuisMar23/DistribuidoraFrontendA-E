import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterDto } from '../../../interfaces/register.interface';
import { LoginDto } from '../../../interfaces/login.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  login(data:LoginDto): Observable<LoginDto> {
    console.log(data)
    return this.http.post<LoginDto>(`${this.apiUrl}/auth/login`,data);
  }
  
  register(data: RegisterDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data).pipe(
      tap((res: any) => {
        if (res.access_token) {
          this.saveTokens(res.access_token, res.refresh_token);
        }
      })
    );
  }

  // Método para recuperación de contraseña
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  private saveTokens(access: string, refresh: string) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }
  
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
  
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
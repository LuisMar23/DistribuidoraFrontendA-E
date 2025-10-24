// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private baseUrl = environment.apiUrl +'/dahsboard';

  constructor(private http: HttpClient) {}

  getGeneral(): Observable<any> {
    return this.http.get(`${this.baseUrl}/general`);
  }

  getVentas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/ventas`);
  }

  getCompras(): Observable<any> {
    return this.http.get(`${this.baseUrl}/compras`);
  }

  getCaja(): Observable<any> {
    return this.http.get(`${this.baseUrl}/caja`);
  }

  getFaenas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/faenas`);
  }

  getPersonas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/personas`);
  }

  getClientesDeuda() {
    return this.http.get<{ deuda: number; sinDeuda: number; totalClientes: number }>(
      `${this.baseUrl}/clientes-deuda`
    );
  }
  
}

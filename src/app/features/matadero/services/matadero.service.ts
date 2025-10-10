// src/matadero/services/matadero.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Matadero, CreateMataderoDto } from '../../../core/interfaces/matadero.interface';

@Injectable({
  providedIn: 'root',
})
export class MataderoService {
  private apiUrl = 'http://localhost:3000/matadero';

  constructor(private http: HttpClient) {}

  getAll(page: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }

  getById(id: number): Observable<Matadero> {
    return this.http.get<Matadero>(`${this.apiUrl}/${id}`);
  }

  create(matadero: CreateMataderoDto): Observable<Matadero> {
    return this.http.post<Matadero>(`${this.apiUrl}`, matadero);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getPesoTotalByCompra(compraId: number): Observable<{ pesoTotal: number }> {
    return this.http.get<{ pesoTotal: number }>(`${this.apiUrl}/compra/${compraId}/peso-total`);
  }
}

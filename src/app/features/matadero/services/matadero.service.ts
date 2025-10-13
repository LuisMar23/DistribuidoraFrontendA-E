import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Matadero, CreateMataderoDto } from '../../../core/interfaces/matadero.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MataderoService {
  private apiUrl = environment.apiUrl + '/matadero';

  constructor(private http: HttpClient) {}

  getAll(page: number = 1, pageSize: number = 10): Observable<any> {
    const url = `${this.apiUrl}?page=${page}&pageSize=${pageSize}`;
    console.log('Solicitando mataderos desde:', url);
    return this.http.get<any>(url);
  }

  getById(id: number): Observable<Matadero> {
    return this.http.get<Matadero>(`${this.apiUrl}/${id}`);
  }

  create(matadero: CreateMataderoDto): Observable<any> {
    console.log('Enviando registro a matadero:', matadero);
    return this.http.post<any>(`${this.apiUrl}`, matadero);
  }

  update(id: number, matadero: any): Observable<any> {
    console.log('Actualizando matadero:', id, matadero);
    return this.http.put<any>(`${this.apiUrl}/${id}`, matadero);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getPesoTotalByCompra(compraId: number): Observable<{ pesoTotal: number }> {
    return this.http.get<{ pesoTotal: number }>(`${this.apiUrl}/compra/${compraId}/peso-total`);
  }

  // Método para probar la conexión
  testConnection(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/test/connection`);
  }
}

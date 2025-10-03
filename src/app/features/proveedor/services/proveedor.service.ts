import { Injectable, signal } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CountResponse, ProveedorDto } from '../../../core/interfaces/suplier.interface';

@Injectable({
  providedIn: 'root',
})
export class ProveedorService {
  apiUrl = environment.apiUrl;
  proveedores = signal<ProveedorDto[]>([]);
  total = signal(0);

  constructor(private http: HttpClient) {}
  getAll(
    page: number = 1,
    pageSize: number = 5,
    sortColumn: string = 'creado_en',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<{ data: ProveedorDto[]; total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortColumn', sortColumn)
      .set('sortDirection', sortDirection);

    return this.http.get<{ data: ProveedorDto[]; total: number }>(`${this.apiUrl}/proveedor`, {
      params,
    });
  }
  getById(id: number): Observable<ProveedorDto> {
    return this.http.get<ProveedorDto>(`${this.apiUrl}/proveedor/${id}`);
  }
  create(proveedor: ProveedorDto): Observable<ProveedorDto> {
    return this.http.post<ProveedorDto>(`${this.apiUrl}/proveedor`, proveedor);
  }
  update(id: number, proveedor: Partial<ProveedorDto>): Observable<ProveedorDto> {
    return this.http.patch<ProveedorDto>(`${this.apiUrl}/proveedor/${id}`, proveedor);
  }
  delete(id: number): Observable<ProveedorDto> {
    return this.http.delete<ProveedorDto>(`${this.apiUrl}/proveedor/${id}`);
  }

  count(): Observable<CountResponse> {
    return this.http.get<CountResponse>(`${this.apiUrl}/proveedor/count`);
  }
    // Método para cargar proveedores y actualizar signals
  cargar(page: number = 1, pageSize: number = 50) {
    this.getAll(page, pageSize).subscribe({
      next: (res) => {
        this.proveedores.set(res.data);
        this.total.set(res.total);
      },
      error: (err) => {
        console.error('Error al cargar proveedores', err);
        this.proveedores.set([]);
        this.total.set(0);
      },
    });
  }
}

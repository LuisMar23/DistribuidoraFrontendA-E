import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VentaDto } from '../../../core/interfaces/venta.interface';

@Injectable({
  providedIn: 'root',
})
export class VentaService {
  apiUrl = `${environment.apiUrl}/venta`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VentaDto[]> {
    return this.http.get<VentaDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<VentaDto> {
    return this.http.get<VentaDto>(`${this.apiUrl}/${id}`);
  }

  create(venta: any): Observable<VentaDto> {
    return this.http.post<VentaDto>(this.apiUrl, venta);
  }

  update(id: number, venta: any): Observable<VentaDto> {
    return this.http.patch<VentaDto>(`${this.apiUrl}/${id}`, venta);
  }

  delete(id: number): Observable<VentaDto> {
    return this.http.delete<VentaDto>(`${this.apiUrl}/${id}`);
  }
}

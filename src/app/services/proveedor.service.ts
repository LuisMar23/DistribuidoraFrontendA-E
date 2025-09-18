import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ProveedorDto } from '../../interfaces/proveedor.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProveedorService {
  apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}
  getAll(): Observable<ProveedorDto[]> {
    return this.http.get<ProveedorDto[]>(this.apiUrl);
  }
  getById(id: number): Observable<ProveedorDto> {
    return this.http.get<ProveedorDto>(`${this.apiUrl}/${id}`);
  }
  create(proveedor: ProveedorDto): Observable<ProveedorDto> {
    return this.http.post<ProveedorDto>(this.apiUrl, proveedor);
  }
  update(id: number, proveedor: Partial<ProveedorDto>): Observable<ProveedorDto> {
    return this.http.patch<ProveedorDto>(`${this.apiUrl}/${id}`, proveedor);
  }
  delete(id: number): Observable<ProveedorDto> {
    return this.http.delete<ProveedorDto>(`${this.apiUrl}/${id}`);
  }
}

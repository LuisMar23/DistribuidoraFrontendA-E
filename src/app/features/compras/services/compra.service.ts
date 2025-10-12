import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Parte {
  nombre: string;
  pesoNeto: number;
  precioUnit: number;
  observaciones?: string;
}

export interface Res {
  numero: number;
  partes: Parte[];
}

export interface Transporte {
  tipo: 'LOCAL' | 'DEPARTAMENTAL';
  descripcion?: string;
  costo: number;
  observaciones?: string;
}

export interface DetalleCompra {
  pesoNeto: number;
  pesoBruto: number;
  precio: number;
  precioTotal: number;
  cantidad: number;
}

export interface CreateCompraDto {
  proveedorId: number;
  usuarioId: number;
  observaciones?: string;
  otrosGastos?: number;
  detalles?: DetalleCompra[];
  transportes?: Transporte[];
}

export interface Compra {
  id: number;
  codigo: string;
  creado_en: string;
  proveedor: {
    id_proveedor: number;
    nombre: string;
    telefono?: string;
  };
  detalles: DetalleCompra[];
  transportes: Transporte[];
  PagoCompra: any[];
  estado: string;
  otrosGastos?: number;
  usuario?: {
    id: number;
    fullName: string;
    username: string;
  };
}

export interface CompraResponse {
  success: boolean;
  data: Compra[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CreateCompraResponse {
  success: boolean;
  compra: any;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompraService {
  private baseUrl = environment.apiUrl + '/compras';
  private http = inject(HttpClient);

  create(compra: CreateCompraDto): Observable<CreateCompraResponse> {
    console.log('Enviando compra a:', `${this.baseUrl}`, compra);
    return this.http.post<CreateCompraResponse>(`${this.baseUrl}`, compra);
  }

  getAll(page: number = 1, pageSize: number = 10): Observable<any> {
    const url = `${this.baseUrl}?page=${page}&pageSize=${pageSize}`;
    console.log('Solicitando compras desde:', url);

    return this.http.get<any>(url).pipe(
      tap((response) => {
        console.log('Respuesta del backend:', response);
        console.log('Tipo de respuesta:', typeof response);
        console.log('Es array:', Array.isArray(response));
      })
    );
  }

  getById(id: number): Observable<Compra> {
    console.log('Solicitando compra ID:', id);
    return this.http.get<Compra>(`${this.baseUrl}/${id}`);
  }

  update(id: number, compra: Partial<CreateCompraDto>): Observable<any> {
    console.log('Actualizando compra ID:', id);
    return this.http.patch(`${this.baseUrl}/${id}`, compra);
  }

  delete(id: number): Observable<any> {
    console.log('Eliminando compra ID:', id);
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}

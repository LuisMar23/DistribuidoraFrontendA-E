import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PersonaDto } from '../../../core/interfaces/persona.interface';


export interface DetalleCompra {
  pesoNeto: number;
  pesoBruto: number;
  precio: number;
  precioTotal: number;
  cantidad: number;
}

export interface CreateCompraDto {
  proveedorId: number;
  observaciones?: string;
  otrosGastos?: number;
  detalles?: DetalleCompra[];
  transportes?: number;
}

export interface Compra {
  id: number;
  codigo: string;
  creado_en: string;
  proveedor: {
    id_proveedor: number;
    persona:PersonaDto

  };
  detalles: DetalleCompra[];
  transportes: number;
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
    return this.http.post<CreateCompraResponse>(`${this.baseUrl}`, compra);
  }

  getAll(page: number = 1, pageSize: number = 10): Observable<any> {
    const url = `${this.baseUrl}?page=${page}&pageSize=${pageSize}`;


    return this.http.get<any>(url).pipe(
  
    );
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  update(id: number, compra: Partial<CreateCompraDto>): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}`, compra);
  }

  delete(id: number): Observable<any> {
 
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}

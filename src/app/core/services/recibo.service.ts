import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Recibo {
  id: number;
  uuid: string;
  tipoOperacion: 'COMPRA' | 'VENTA';
  compraId?: number;
  ventaId?: number;
  pagoPlanPagoId?: number;
  urlArchivo: string;
  tipoArchivo?: string;
  nombreArchivo?: string;
  creado_en: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReciboService {
  private baseUrl = environment.apiUrl + '/recibos';

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(this.baseUrl);
  }

  obtenerPorCompra(compraId: number): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(`${this.baseUrl}/compra/${compraId}`);
  }

  obtenerPorVenta(ventaId: number): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(`${this.baseUrl}/venta/${ventaId}`);
  }

  obtenerPorPlanPago(planPagoId: number): Observable<Recibo[]> {
    return this.http.get<Recibo[]>(`${this.baseUrl}/plan-pago/${planPagoId}`);
  }

  subirArchivo(
    file: File,
    dto: {
      tipoOperacion: 'compra' | 'venta';
      compraId?: number;
      ventaId?: number;
      pagoPlanPagoId?: number;
    }
  ): Observable<Recibo> {
    const formData = new FormData();
    formData.append('file', file);
    for (const key of Object.keys(dto) as Array<keyof typeof dto>) {
      const value = dto[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    }
    return this.http.post<Recibo>(`${this.baseUrl}/upload`, formData);
  }
 subirArchivos(
    files: File[],
    dto: {
      tipoOperacion: 'compra' | 'venta';
      compraId?: number;
      ventaId?: number;
      pagoPlanPagoId?: number;
    }
  ): Observable<Recibo[]> {
    const formData = new FormData();
    
    // Agregar todos los archivos
    files.forEach((file, index) => {
      formData.append('files', file); // El backend debe esperar 'files[]' o 'files'
    });
    
    // Agregar los datos adicionales
    for (const key of Object.keys(dto) as Array<keyof typeof dto>) {
      const value = dto[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    }
    
    return this.http.post<Recibo[]>(`${this.baseUrl}/upload`, formData);
  }
  actualizar(id: number, dto: Partial<Recibo>): Observable<Recibo> {
    return this.http.patch<Recibo>(`${this.baseUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

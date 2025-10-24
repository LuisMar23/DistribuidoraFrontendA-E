// src/app/services/detalle-faena.service.ts
import { Injectable, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleFaena, RegistrarPagoDto } from '../../../core/interfaces/faena.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DetalleFaenaService {
  private apiUrl = environment.apiUrl + '/detalle-faena';

  private _detallesFaena = signal<DetalleFaena[]>([]);
  detallesFaena: Signal<DetalleFaena[]> = this._detallesFaena.asReadonly();

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<DetalleFaena>(`${this.apiUrl}`);
  }

  getById(id: number): Observable<DetalleFaena> {
    return this.http.get<DetalleFaena>(`${this.apiUrl}/${id}`);
  }

  create(detalle: Partial<DetalleFaena>): Observable<DetalleFaena> {
    return this.http.post<DetalleFaena>(this.apiUrl, detalle);
  }

  update(id: number, detalle: Partial<DetalleFaena>): Observable<DetalleFaena> {
    return this.http.put<DetalleFaena>(`${this.apiUrl}/${id}`, detalle);
  }

  // Eliminar
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  registrarPago(id: number, dto: RegistrarPagoDto, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('fechaPago', dto.fechaPago);
    formData.append('formaPago', dto.formaPago);
    formData.append('cajaId', dto.cajaId.toString());

    if (dto.referencia) formData.append('referencia', dto.referencia);
    if (dto.observaciones) formData.append('observaciones', dto.observaciones);
    if (file) formData.append('comprobante', file, file.name);

    return this.http.post(`${this.apiUrl}/${id}/registrar-pago`, formData);
  }

  anularPago(id: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/anular-pago`, { usuarioId });
  }
  actualizarImagen(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('comprobante', archivo);

    return this.http.patch(`${this.apiUrl}/${id}/actualizar-imagen`, formData);
  }

  marcarComoPagado(id: number, cajaId: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}/marcar-pagado`, { cajaId });
}
}

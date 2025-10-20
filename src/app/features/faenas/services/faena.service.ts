// src/app/services/detalle-faena.service.ts
import { Injectable, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleFaena } from '../../../core/interfaces/faena.interface';
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
}

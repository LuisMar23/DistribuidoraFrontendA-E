// services/movimiento.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Movimiento } from '../../../core/interfaces/caja.interface';
import { environment } from '../../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class MovimientoService {
  private apiUrl = environment.apiUrl;

  movimientos = signal<Movimiento[]>([]);
  totales = signal<Record<string, number>>({});

  constructor(private http: HttpClient) {}

loadByCaja(cajaId: number) {
  this.http.get<any>(`${this.apiUrl}/movimiento/caja/${cajaId}`)
    .subscribe((caja) => {
      this.movimientos.set(caja);
    });
}
  addMovimiento(payload: Partial<Movimiento>|any) {
    this.http.post<Movimiento>(this.apiUrl, payload)
      .subscribe((mov) => this.movimientos.update(prev => [mov, ...prev]));
  }

loadTotales(cajaId: number) {
  this.http
    .get<Record<string, number>>(`${this.apiUrl}/movimiento/totales?cajaId=${cajaId}`)
    .subscribe((res) => this.totales.set(res));
}
}

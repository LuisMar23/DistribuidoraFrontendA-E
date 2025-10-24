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
total = signal(0);
page = signal(1);
pageSize = signal(10);
  constructor(private http: HttpClient) {}

loadByCaja(cajaId: number) {
  this.http
    .get<{ data: Movimiento[]; total: number; page: number; pageSize: number }>(
      `${this.apiUrl}/movimiento/caja/${cajaId}`
    )
    .subscribe({
      next: (res) => {
        // ✅ Guarda correctamente los datos en signals
        this.movimientos.set(res.data);
        this.total.set(res.total);
           this.page.set(res.page);
        this.pageSize.set(res.pageSize);
      },
      error: (err) => {
        console.error('Error al cargar movimientos:', err);
      },
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

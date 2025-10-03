import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Caja } from '../../../core/interfaces/caja.interface';

@Injectable({
  providedIn: 'root',
})
export class CajaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  cajas = signal<Caja[]>([]);
  cajaSeleccionada = signal<Caja | null>(null);
  cargando = signal(false);

  cargarCajas() {
    this.cargando.set(true);
    this.http.get<Caja[]>(`${this.apiUrl}/caja`).subscribe({
      next: (data) => {
        const parsed = data.map((c) => ({
          ...c,
          saldo: Number(c.saldoActual), // <-- conversión aquí
        }));
        this.cajas.set(parsed);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  crearCaja(data: { nombre: string; montoInicial?: number; usuarioAperturaId?: number }) {
    return this.http.post<Caja>(`${this.apiUrl}/caja`, data).subscribe((nueva) => {
      this.cajas.update((prev) => [...prev, nueva]);
    });
  }

  abrirCaja(id: number) {
    return this.http.post<Caja>(`${this.apiUrl}/caja/${id}/abrir`, {}).subscribe((upd) => {
      this.cajas.update((prev) => prev.map((c) => (c.id === id ? upd : c)));
    });
  }

  cerrarCaja(id: number) {
    return this.http.post<Caja>(`${this.apiUrl}/caja/${id}/cerrar`, {}).subscribe((upd) => {
      this.cajas.update((prev) => prev.map((c) => (c.id === id ? upd : c)));
    });
  }
}

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { VentaDto } from '../../../core/interfaces/venta.interface';

@Injectable({
  providedIn: 'root',
})
export class VentaService {
  apiUrl = `${environment.apiUrl}/venta`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VentaDto[]> {
    return this.http.get<VentaDto[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error obteniendo ventas:', error);
        return of([]);
      })
    );
  }

  getById(id: number): Observable<VentaDto> {
    return this.http.get<VentaDto>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error obteniendo venta ${id}:`, error);
        throw error;
      })
    );
  }

  create(venta: any): Observable<VentaDto> {
    return this.http.post<VentaDto>(this.apiUrl, venta).pipe(
      catchError((error) => {
        console.error('Error creando venta:', error);
        throw error;
      })
    );
  }

  update(id: number, venta: any): Observable<VentaDto> {
    return this.http.patch<VentaDto>(`${this.apiUrl}/${id}`, venta).pipe(
      catchError((error) => {
        console.error(`Error actualizando venta ${id}:`, error);
        throw error;
      })
    );
  }

  delete(id: number): Observable<VentaDto> {
    return this.http.delete<VentaDto>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error eliminando venta ${id}:`, error);
        throw error;
      })
    );
  }

  // Métodos para planes de pago
  registrarPagoPlan(pagoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/plan-pago/pagar`, pagoData).pipe(
      catchError((error) => {
        console.error('Error registrando pago:', error);
        throw error;
      })
    );
  }

  obtenerResumenPlanPago(planPagoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/plan-pago/${planPagoId}/resumen`).pipe(
      catchError((error) => {
        console.error(`Error obteniendo resumen plan ${planPagoId}:`, error);
        throw error;
      })
    );
  }

  obtenerPlanesPagoActivos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/planes-pago/activos`).pipe(
      catchError((error) => {
        console.error('Error obteniendo planes activos:', error);
        return of([]);
      })
    );
  }

  // MÉTODO PRINCIPAL CORREGIDO: Obtener clientes con deudas pendientes
  obtenerClientesConDeudas(): Observable<any[]> {
    return this.getAll().pipe(
      map((ventas) => {
        try {
          return this.procesarVentasParaDeudas(ventas);
        } catch (error) {
          console.error('Error procesando ventas para deudas:', error);
          return [];
        }
      }),
      catchError((error) => {
        console.error('Error obteniendo clientes con deudas:', error);
        return of([]);
      })
    );
  }

  private procesarVentasParaDeudas(ventas: VentaDto[]): any[] {
    if (!ventas || !Array.isArray(ventas)) {
      return [];
    }

    const clientesMap = new Map<number, any>();

    const ventasValidas = ventas.filter(
      (venta) => venta && typeof venta === 'object' && this.isValidId(venta.id_cliente)
    );

    ventasValidas.forEach((venta) => {
      try {
        if (this.tieneDeudaPendiente(venta.planPago)) {
          const clienteId = venta.id_cliente!;
          const cliente = venta.cliente;

          if (!clientesMap.has(clienteId)) {
            clientesMap.set(clienteId, {
              id_cliente: clienteId,
              nombre_cliente: this.getClienteNombre(cliente),
              ventas: [],
              deuda_total: 0,
            });
          }

          const clienteData = clientesMap.get(clienteId);

          const totalPagado = this.calcularTotalPagado(venta.planPago!.pagos || []);
          const totalVenta = this.safeNumber(venta.total);
          const saldoPendiente = this.safeNumber(venta.planPago!.total) - totalPagado;

          if (saldoPendiente > 0) {
            const ventaConDeuda = {
              id_venta: venta.id_venta || 0,
              fecha_venta: venta.fecha_venta || '',
              total_venta: totalVenta,
              total_pagado: totalPagado,
              saldo_pendiente: saldoPendiente,
              plan_pago: venta.planPago,
            };

            clienteData.ventas.push(ventaConDeuda);
            clienteData.deuda_total += saldoPendiente;
          }
        }
      } catch (error) {
        console.error('Error procesando venta:', venta, error);
      }
    });

    return Array.from(clientesMap.values())
      .filter(
        (cliente) =>
          cliente &&
          cliente.ventas &&
          Array.isArray(cliente.ventas) &&
          cliente.ventas.length > 0 &&
          cliente.deuda_total > 0
      )
      .sort((a, b) => b.deuda_total - a.deuda_total);
  }

  private tieneDeudaPendiente(planPago: any): boolean {
    if (!planPago || typeof planPago !== 'object') {
      return false;
    }

    if (planPago.estado === 'PAGADO' || planPago.estado === 'CANCELADO') {
      return false;
    }

    const totalPagado = this.calcularTotalPagado(planPago.pagos || []);
    const totalPlan = this.safeNumber(planPago.total);

    return totalPagado < totalPlan;
  }

  private calcularTotalPagado(pagos: any[]): number {
    if (!pagos || !Array.isArray(pagos)) return 0;

    return pagos.reduce((sum, pago) => {
      if (!pago || typeof pago !== 'object') return sum;
      const monto = this.safeNumber(pago.monto);
      return sum + monto;
    }, 0);
  }

  private safeNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    try {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? 0 : num;
    } catch {
      return 0;
    }
  }

  private isValidId(id: any): boolean {
    return id !== null && id !== undefined && !isNaN(Number(id));
  }

  private getClienteNombre(cliente: any): string {
    if (!cliente || typeof cliente !== 'object') {
      return 'Cliente N/A';
    }

    try {
      if (cliente.persona?.nombre) {
        return `${cliente.persona.nombre} ${cliente.persona.apellido || ''}`.trim();
      }

      if (cliente.nombre) {
        return cliente.nombre;
      }

      return 'Cliente N/A';
    } catch {
      return 'Cliente N/A';
    }
  }

  subirRecibosPlanPago(pagoPlanPagoId: number, files: File[]): Observable<any> {
    try {
      const formData = new FormData();

      if (!files || !Array.isArray(files)) {
        throw new Error('Archivos inválidos');
      }

      files.forEach((file) => {
        if (file instanceof File) {
          formData.append('files', file);
        }
      });

      formData.append('pagoPlanPagoId', pagoPlanPagoId.toString());

      return this.http.post<any>(`${environment.apiUrl}/recibos/plan-pago/upload`, formData).pipe(
        catchError((error) => {
          console.error('Error subiendo recibos:', error);
          throw error;
        })
      );
    } catch (error) {
      console.error('Error preparando datos para subir recibos:', error);
      throw error;
    }
  }

  obtenerRecibosPorPlanPago(pagoPlanPagoId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/recibos/plan-pago/${pagoPlanPagoId}`).pipe(
      catchError((error) => {
        console.error(`Error obteniendo recibos para plan ${pagoPlanPagoId}:`, error);
        return of([]);
      })
    );
  }

  eliminarReciboPlanPago(reciboId: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/recibos/${reciboId}`).pipe(
      catchError((error) => {
        console.error(`Error eliminando recibo ${reciboId}:`, error);
        throw error;
      })
    );
  }
}

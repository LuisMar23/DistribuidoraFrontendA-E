import { Component, inject, signal, OnInit } from '@angular/core';
import { CompraService, Compra } from '../../services/compra.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-compra-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compra-list.html',
})
export class CompraList implements OnInit {
  compras = signal<Compra[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  private compraSvc = inject(CompraService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.obtenerCompras();
  }

  obtenerCompras(page: number = 1) {
    this.cargando.set(true);
    this.error.set(null);

    this.compraSvc.getAll(page, 10).subscribe({
      next: (resp: any) => {
        console.log('Respuesta completa del backend:', resp);

        let comprasData: Compra[] = [];

        if (resp && Array.isArray(resp)) {
          comprasData = resp;
        } else if (resp && resp.success && Array.isArray(resp.data)) {
          comprasData = resp.data;
        } else if (resp && Array.isArray(resp.compras)) {
          comprasData = resp.compras;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
          comprasData = resp.data;
        } else {
          console.warn('Estructura de respuesta no reconocida:', resp);
          this.notificationService.showWarning('Estructura de datos inesperada del servidor');
        }

        if (comprasData.length > 0) {
          console.log(`${comprasData.length} compras cargadas correctamente`);
          this.compras.set(comprasData);
        } else {
          console.log('No se encontraron compras');
          this.compras.set([]);
        }

        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar compras:', err);

        if (err.status === 401) {
          this.error.set('No autorizado. Por favor, inicie sesión nuevamente.');
          this.notificationService.showError(
            'Sesión expirada. Por favor, inicie sesión nuevamente.'
          );
        } else if (err.status === 404) {
          this.error.set('Endpoint no encontrado. Verifique la URL del servicio.');
          this.notificationService.showError('Error de configuración del servicio.');
        } else {
          this.error.set(
            'No se pudieron cargar las compras: ' + (err.message || 'Error desconocido')
          );
          this.notificationService.showError(
            'Error al cargar las compras: ' + (err.message || 'Error desconocido')
          );
        }

        this.cargando.set(false);
      },
      complete: () => {
        console.log('Petición de compras completada');
        this.cargando.set(false);
      },
    });
  }

  eliminarCompra(id: number) {
    if (confirm('¿Seguro que quieres eliminar esta compra?')) {
      this.compraSvc.delete(id).subscribe({
        next: () => {
          this.compras.update((list) => list.filter((c) => c.id !== id));
          this.notificationService.showSuccess('Compra eliminada correctamente');
        },
        error: (err) => {
          console.error('Error al eliminar compra:', err);

          if (err.status === 401) {
            this.notificationService.showError(
              'Sesión expirada. Por favor, inicie sesión nuevamente.'
            );
          } else {
            this.notificationService.showError('Error al eliminar la compra: ' + err.message);
          }
        },
      });
    }
  }

  getTotalCompra(compra: Compra): number {
    if (!compra.detalles || compra.detalles.length === 0) return 0;

    const subtotalDetalles = compra.detalles.reduce(
      (sum, detalle) => sum + Number(detalle.precioTotal || 0),
      0
    );

    const totalTransportes =
      compra.transportes?.reduce((sum, transporte) => sum + Number(transporte.costo || 0), 0) || 0;

    const otrosGastos = Number(compra.otrosGastos || 0);

    return subtotalDetalles + totalTransportes + otrosGastos;
  }

  getCantidadReses(compra: Compra): number {
    if (!compra.detalles || compra.detalles.length === 0) return 0;
    return compra.detalles.reduce((sum, detalle) => sum + Number(detalle.cantidad || 0), 0);
  }

  getPesoNeto(compra: Compra): number {
    if (!compra.detalles || compra.detalles.length === 0) return 0;
    return compra.detalles.reduce((sum, detalle) => sum + Number(detalle.pesoNeto || 0), 0);
  }

  getEstadoDisplay(compra: Compra): string {
    const estado = compra.estado?.toLowerCase() || 'completada';
    switch (estado) {
      case 'pendiente':
        return 'PENDIENTE';
      case 'pagado':
        return 'COMPLETADA';
      case 'anulado':
        return 'CANCELADA';
      default:
        return 'COMPLETADA';
    }
  }

  getEstadoClass(compra: Compra): string {
    const estado = compra.estado?.toLowerCase() || 'completada';
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700';
      case 'pagado':
        return 'bg-green-100 text-green-700';
      case 'anulado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  }

  recargar() {
    this.obtenerCompras();
  }
}

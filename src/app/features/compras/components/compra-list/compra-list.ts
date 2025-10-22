import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CompraService, Compra } from '../../services/compra.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-compra-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './compra-list.html',
})
export class CompraList implements OnInit {
  compras = signal<Compra[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  total = signal(0);
  pageSize = signal(10);
  currentPage = signal(1);
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  faFileExcel = faFileExcel;

  searchTerm = signal('');

  private compraSvc = inject(CompraService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.obtenerCompras();
  }
  columns = [
    { key: 'id', label: 'N°' },
    { key: 'codigo', label: 'Código' },
    { key: 'fechaCompra', label: 'Fecha' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'detalles', label: 'N# Reses' },
    { key: 'detalles', label: 'Peso Neto (kg)' },
    { key: 'detalles', label: 'Precio Total (Bs)' },
  ];

  obtenerCompras(page: number = 1) {
    this.cargando.set(true);
    this.error.set(null);

    this.compraSvc.getAll(page, 10).subscribe({
      next: (resp: any) => {
        console.log(resp);
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
          this.notificationService.showWarning('Estructura de datos inesperada del servidor');
        }

        if (comprasData.length > 0) {
          console.log(`${comprasData.length} compras cargadas correctamente`);
          this.compras.set(comprasData);
        } else {
          console.log('No se encontraron compras');
          this.compras.set([]);
        }
        this.total.set(resp.total);
        this.cargando.set(false);
        if (this.sortColumn()) this.ordenarCompras();
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

  filteredCompras = computed(() => {
    let arr = this.compras();

    const term = (this.searchTerm() ?? '').toLowerCase();
    if (!term) return arr;

    return arr.filter((p) => {
      return (
        (p.creado_en
          ? new Date(p.creado_en).toLocaleDateString('es-BO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : ''
        )
          .toLowerCase()
          .includes(term.toLowerCase()) ||
        (p.codigo || '').toLowerCase().includes(term) ||
        (p.proveedor.persona.nombre || '').toLowerCase().includes(term)
      );
    });
  });
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

  sort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    this.ordenarCompras();
  }
  ordenarCompras() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.compras()];

    arr.sort((a, b) => {
      const valA = a[col as keyof Compra];
      const valB = b[col as keyof Compra];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });

    this.compras.set(arr);
  }
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.obtenerCompras();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.obtenerCompras();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.obtenerCompras();
    }
  }

  totalPages() {
    return Math.ceil(this.total() / this.pageSize());
  }

  pageArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  rangeStart(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    const end = this.currentPage() * this.pageSize();
    return end > this.total() ? this.total() : end;
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  faShoppingCart,
  faEye,
  faPenToSquare,
  faSearch,
  faTrash,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VentaDto } from '../../../../core/interfaces/venta.interface';

import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { Router, RouterModule } from '@angular/router';
import { VentaService } from '../../services/venta.service';

// Interface para las columnas con tipo seguro
interface ColumnConfig {
  key: keyof VentaDto;
  label: string;
}

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [FormsModule, FontAwesomeModule, CommonModule, RouterModule],
  templateUrl: './venta.html',
  styleUrl: './venta.css',
})
export class VentaComponent {
  faShoppingCart = faShoppingCart;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faSearch = faSearch;
  faPlus = faPlus;

  ventas = signal<VentaDto[]>([]);
  searchTerm = signal('');
  ventaSeleccionada = signal<VentaDto | null>(null);
  mostrarModalEditar = signal(false);

  // Usar la interfaz ColumnConfig para asegurar tipos
  columns: ColumnConfig[] = [
    { key: 'id_venta', label: 'ID' },
    { key: 'estado', label: 'Estado' },
    { key: 'id_cliente', label: 'Cliente' },
    { key: 'fecha_venta', label: 'Fecha Venta' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'descuento', label: 'Descuento' },
    { key: 'total', label: 'Total' },
    { key: 'metodo_pago', label: 'Método Pago' },
  ];

  total = signal(0);
  pageSize = signal(10);
  currentPage = signal(1);
  sortColumn = signal<keyof VentaDto | null>(null); // Inicialmente sin ordenamiento
  sortDirection = signal<'asc' | 'desc'>('desc');

  _notificationService = inject(NotificationService);
  private router = inject(Router);

  constructor(private ventaService: VentaService) {
    this.loadVentas();
  }

  loadVentas() {
    this.ventaService.getAll().subscribe((ventas: VentaDto[]) => {
      // Solo aplicar ordenamiento si el usuario ha hecho clic en una columna
      let ventasParaMostrar = ventas;

      if (this.sortColumn()) {
        ventasParaMostrar = this.sortVentas(ventas);
      }

      const paginatedVentas = this.paginateVentas(ventasParaMostrar);
      this.ventas.set(paginatedVentas);
      this.total.set(ventas.length);
    });
  }

  // Ordenar ventas manualmente - SOLO cuando hay una columna seleccionada
  private sortVentas(ventas: VentaDto[]): VentaDto[] {
    const column = this.sortColumn();
    if (!column) {
      return ventas; // Retornar sin ordenar si no hay columna seleccionada
    }

    return ventas.sort((a, b) => {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;

      let aValue: any = a[column];
      let bValue: any = b[column];

      // Manejar valores undefined/null
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      // Ordenar por fechas
      if (column === 'fecha_venta') {
        return direction * (new Date(aValue).getTime() - new Date(bValue).getTime());
      }

      // Ordenar por números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction * (aValue - bValue);
      }

      // Ordenar por texto
      return direction * aValue.toString().localeCompare(bValue.toString());
    });
  }

  // Paginar ventas manualmente
  private paginateVentas(ventas: VentaDto[]): VentaDto[] {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return ventas.slice(startIndex, endIndex);
  }

  filteredVentas = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.ventas();
    }

    return this.ventas().filter(
      (v) =>
        (v.cliente?.nombre || '').toLowerCase().includes(term) ||
        v.metodo_pago.toLowerCase().includes(term) ||
        v.estado.toLowerCase().includes(term) ||
        v.id_venta?.toString().includes(term)
    );
  });

  getEstadoClass(estado: string): string {
    const classes: { [key: string]: string } = {
      pendiente:
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize',
      pagado:
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize',
      anulado:
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize',
    };
    return classes[estado] || classes['pendiente'];
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Redirigir a la vista de creación
  createVenta() {
    this.router.navigate(['/ventas/crear']);
  }

  // MODIFICADO: Redirigir a la vista de edición
  edit(venta: VentaDto) {
    this.router.navigate(['/ventas/editar', venta.id_venta]);
  }

  // Cerrar modal de edición (ya no se usa pero lo dejo por si acaso)
  cerrarModalEditar() {
    this.mostrarModalEditar.set(false);
    this.ventaSeleccionada.set(null);
  }

  // Guardar cambios del modal (ya no se usa pero lo dejo por si acaso)
  guardarCambios(ventaActualizada: VentaDto) {
    // Esta función ya no se usa ya que la edición se hace en otro componente
    this.ventaService.update(ventaActualizada.id_venta!, ventaActualizada).subscribe({
      next: () => {
        this._notificationService.showSuccess('Venta actualizada correctamente');
        this.cerrarModalEditar();
        this.loadVentas(); // Recargar la lista
      },
      error: (error) => {
        this._notificationService.showError('Error al actualizar la venta');
        console.error('Error updating venta:', error);
      },
    });
  }

  delete(venta: VentaDto) {
    this._notificationService
      .confirmDelete(`Se eliminará la venta #${venta.id_venta}`)
      .then((result) => {
        if (result.isConfirmed) {
          this.ventaService.delete(venta.id_venta!).subscribe(() => {
            this._notificationService.showSuccess('Eliminado correctamente');
            this.loadVentas();
          });
        }
      });
  }

  // Paginación - SOLO se ordena cuando el usuario hace clic
  sort(column: keyof VentaDto) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
    this.loadVentas(); // Recargar con el nuevo ordenamiento
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.loadVentas();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.loadVentas();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadVentas();
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

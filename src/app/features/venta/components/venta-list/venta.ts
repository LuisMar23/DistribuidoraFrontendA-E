import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  faShoppingCart,
  faEye,
  faPenToSquare,
  faSearch,
  faTrash,
  faPlus,
  faCalendarAlt,
  faDollarSign,
  faUser,
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
})
export class VentaComponent {
  // Iconos - SOLO los necesarios para el listado
  faShoppingCart = faShoppingCart;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faSearch = faSearch;
  faPlus = faPlus;
  faCalendarAlt = faCalendarAlt;
  faDollarSign = faDollarSign;
  faUser = faUser;

  ventas = signal<VentaDto[]>([]);
  allVentas = signal<VentaDto[]>([]);
  searchTerm = signal('');

  // Usar la interfaz ColumnConfig para asegurar tipos
  columns: ColumnConfig[] = [
    { key: 'id_venta', label: 'ID' },
    { key: 'estado', label: 'Estado' },
    { key: 'id_cliente', label: 'Cliente' },
    { key: 'fecha_venta', label: 'Fecha Venta' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'total', label: 'Total' },
    { key: 'metodo_pago', label: 'Método Pago' },
  ];

  total = signal(0);
  pageSize = signal(10);
  currentPage = signal(1);
  sortColumn = signal<keyof VentaDto>('id_venta');
  sortDirection = signal<'asc' | 'desc'>('desc');

  _notificationService = inject(NotificationService);
  private router = inject(Router);
  private ventaService = inject(VentaService);

  constructor() {
    this.loadVentas();
  }

  loadVentas() {
    this.ventaService.getAll().subscribe({
      next: (ventas: VentaDto[]) => {
        // CORRECCIÓN: Aplicar cálculo correcto del total a todas las ventas
        const ventasCorregidas = ventas.map((venta) => ({
          ...venta,
          // FORZAR el cálculo correcto: total = subtotal - descuento
          total: this.calcularTotalCorrecto(venta),
        }));

        this.allVentas.set(ventasCorregidas);
        this.total.set(ventasCorregidas.length);
        this.applyFilterAndSort();
      },
      error: (error) => {
        console.error('Error loading ventas:', error);
        this._notificationService.showError('Error al cargar las ventas');
      },
    });
  }

  private applyFilterAndSort() {
    let filtered = this.allVentas();

    // Aplicar filtro de búsqueda
    const term = this.searchTerm().toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (v) =>
          this.getClienteNombre(v).toLowerCase().includes(term) ||
          v.metodo_pago.toLowerCase().includes(term) ||
          v.estado.toLowerCase().includes(term) ||
          v.id_venta?.toString().includes(term)
      );
    }

    // Aplicar ordenamiento
    const sorted = this.sortVentas(filtered);

    // Aplicar paginación
    const paginated = this.paginateVentas(sorted);
    this.ventas.set(paginated);
  }

  // Ordenar ventas manualmente
  private sortVentas(ventas: VentaDto[]): VentaDto[] {
    const column = this.sortColumn();
    if (!column) {
      return ventas;
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

      // Ordenar por números (ID, montos)
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
    return this.ventas();
  });

  // CORRECCIÓN: Obtener nombre del cliente igual que en otros componentes
  getClienteNombre(venta: VentaDto): string {
    const cliente = venta.cliente;
    if (!cliente) return 'Cliente N/A';

    // Si tiene persona con nombre y apellido
    if (cliente.persona?.nombre) {
      const nombreCompleto = cliente.persona.nombre
        ? `${cliente.persona.nombre} ${cliente.persona.apellido || ''}`.trim()
        : 'Cliente sin nombre';
      return nombreCompleto;
    }

    // Si tiene nombre directo (sin 'persona')
    if (cliente.nombre) {
      return cliente.nombre;
    }

    // Fallback
    return 'Cliente ' + (venta.id_cliente || 'N/A');
  }

  getEstadoClass(estado: string): string {
    const classes: { [key: string]: string } = {
      pendiente: 'px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700',
      pagado: 'px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700',
      anulado: 'px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700',
    };
    return classes[estado] || classes['pendiente'];
  }

  getMetodoPagoClass(metodoPago: string): string {
    const classes: { [key: string]: string } = {
      efectivo: 'px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700',
      transferencia: 'px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700',
      credito: 'px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700',
    };
    return (
      classes[metodoPago] || 'px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700'
    );
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

  // CORRECCIÓN PRINCIPAL: Calcular total correctamente (subtotal - descuento)
  calcularTotalCorrecto(venta: VentaDto): number {
    const subtotal = Number(venta.subtotal) || 0;
    const descuento = Number(venta.descuento) || 0;
    return Math.max(0, subtotal - descuento);
  }

  // CORRECCIÓN: Obtener el total a mostrar (SIEMPRE usar el calculado)
  getTotalAMostrar(venta: VentaDto): number {
    return this.calcularTotalCorrecto(venta);
  }

  // CORRECCIÓN: Calcular saldo pendiente correctamente
  getSaldoPendiente(venta: VentaDto): number {
    if (!venta.planPago || !venta.planPago.pagos) return 0;

    const totalVenta = this.getTotalAMostrar(venta);
    const totalPagado = venta.planPago.pagos.reduce(
      (sum: number, pago: any) => sum + Number(pago.monto),
      0
    );

    return Math.max(0, totalVenta - totalPagado);
  }

  // Redirigir a la vista de creación
  createVenta() {
    this.router.navigate(['/ventas/crear']);
  }

  // Redirigir a la vista de edición
  edit(venta: VentaDto) {
    this.router.navigate(['/ventas/editar', venta.id_venta]);
  }

  delete(venta: VentaDto) {
    this._notificationService
      .confirmDelete(`¿Está seguro de eliminar la venta #${venta.id_venta}?`)
      .then((result) => {
        if (result.isConfirmed) {
          this.ventaService.delete(venta.id_venta!).subscribe({
            next: () => {
              this._notificationService.showSuccess('Venta eliminada correctamente');
              this.loadVentas();
            },
            error: (error) => {
              console.error('Error deleting venta:', error);
              this._notificationService.showError('Error al eliminar la venta');
            },
          });
        }
      });
  }

  // Métodos de ordenamiento y paginación
  sort(column: keyof VentaDto) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
    this.applyFilterAndSort();
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.applyFilterAndSort();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.applyFilterAndSort();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.applyFilterAndSort();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.applyFilterAndSort();
    }
  }

  totalPages() {
    const filteredLength = this.searchTerm()
      ? this.allVentas().filter(
          (v) =>
            this.getClienteNombre(v).toLowerCase().includes(this.searchTerm().toLowerCase()) ||
            v.metodo_pago.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
            v.estado.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
            v.id_venta?.toString().includes(this.searchTerm())
        ).length
      : this.allVentas().length;

    return Math.ceil(filteredLength / this.pageSize());
  }

  pageArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  rangeStart(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    const filteredLength = this.searchTerm()
      ? this.allVentas().filter(
          (v) =>
            this.getClienteNombre(v).toLowerCase().includes(this.searchTerm().toLowerCase()) ||
            v.metodo_pago.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
            v.estado.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
            v.id_venta?.toString().includes(this.searchTerm())
        ).length
      : this.allVentas().length;

    const end = this.currentPage() * this.pageSize();
    return end > filteredLength ? filteredLength : end;
  }

  getTotalFiltered(): number {
    if (this.searchTerm()) {
      return this.allVentas().filter(
        (v) =>
          this.getClienteNombre(v).toLowerCase().includes(this.searchTerm().toLowerCase()) ||
          v.metodo_pago.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
          v.estado.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
          v.id_venta?.toString().includes(this.searchTerm())
      ).length;
    }
    return this.allVentas().length;
  }
}

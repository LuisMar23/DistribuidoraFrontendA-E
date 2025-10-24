import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CompraService, Compra } from '../../services/compra.service';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { catchError, lastValueFrom, map, Observable, of, shareReplay } from 'rxjs';
import { PdfService } from '../../../../core/services/pdf.service';

@Component({
  selector: 'app-compra-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './compra-list.html',
  providers: [DatePipe],
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
  totalGanancia = signal<number | null>(null);
  searchTerm = signal('');
  precioKilo = signal<number | null>(null);
  detallePrecio = signal<any | null>(null);
  loading = signal<boolean>(false);

  private pdfService = inject(PdfService);
  private compraSvc = inject(CompraService);
  private notificationService = inject(NotificationService);
  private datePipe = inject(DatePipe);
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
  private gananciaCache = new Map<number, Observable<number>>();
  getGananciaCompraCached(id: number): Observable<number> {
    if (!id) return of(0);

    if (this.gananciaCache.has(id)) {
      return this.gananciaCache.get(id)!;
    }

    const obs$ = this.compraSvc.getGananciaCompra(id).pipe(
      map((resp) => {
        console.log('Ganancia recibida:', resp);
        return Number(resp.ganancia || 0);
      }),
      catchError((err) => {
        console.error('Error al obtener la ganancia:', err);
        return of(0);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.gananciaCache.set(id, obs$);
    return obs$;
  }

  getPrecioKilo(id: number): Observable<number> {
    return this.compraSvc.getPrecioKiloCached(id);
  }

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

  eliminarCompra(data: any) {
    this.notificationService
      .confirmDelete(`Se eliminará la compra con codigo ${data.codigo}`)
      .then((result) => {
        if (result.isConfirmed) {
          this.notificationService.showSuccess('Eliminado correctamente');
          this.compraSvc.delete(data.id).subscribe(() => this.compras());
        }
      });
  }

  filteredCompras = computed(() => {
    let arr = this.compras();
    console.log(this.compras());
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

  async downloadPDFCompras() {
    try {
      const compras = this.filteredCompras(); // Tu método que filtra compras
      if (compras.length === 0) {
        this.notificationService.showAlert('No hay compras para generar el PDF');
        return;
      }

      const data = await Promise.all(
        compras.map(async (c, index) => {
          const ganancia = await lastValueFrom(this.getGananciaCompraCached(c.id));
          const precioKilo = await lastValueFrom(this.getPrecioKilo(c.id));

          const pagoTotal = c.PagoCompra?.reduce(
            (sum: number, p: any) => sum + Number(p.monto || 0),
            0
          );

          const detalle = c.detalles[0];

          return {
            numero: index + 1,
            codigo: c.codigo || 'N/A',
            fecha: this.formatDate(c.creado_en),
            proveedor: c.proveedor?.persona?.nombre || 'N/A',
            cantidad: detalle?.cantidad || 0,
            pesoBruto: detalle?.pesoBruto || 0,
            pesoNeto: detalle?.pesoNeto || 0,
            precioUnitario: detalle?.precio || 0,
            totalCompra: detalle?.precioTotal || 0,
            transporte: c.transportes || 0,
            otrosGastos: c.otrosGastos || 0,
            pagoTotal: pagoTotal || 0,
            ganancia,
            precioKilo,
          };
        })
      );
      this.pdfService.downloadTablePdf({
        title: 'Sistema Ventas Carnes',
        subtitle: 'Lista de Compras',
        columns: [
          { header: 'N°', dataKey: 'numero', width: 20, alignment: 'center' },
          { header: 'Código', dataKey: 'codigo', width: 60, alignment: 'center' },
          { header: 'Fecha', dataKey: 'fecha', width: 55, alignment: 'center' },
          { header: 'Proveedor', dataKey: 'proveedor', width: 55, alignment: 'left' },
          { header: 'Cantidad', dataKey: 'cantidad', width: 55, alignment: 'center' },
          { header: 'Peso Bruto', dataKey: 'pesoBruto', width: 55, alignment: 'center' },
          { header: 'Peso Neto', dataKey: 'pesoNeto', width: 55, alignment: 'center' },
          { header: 'Precio Unitario', dataKey: 'precioUnitario', width: 55, alignment: 'center' },
          { header: 'Total', dataKey: 'totalCompra', width: 50, alignment: 'center' },
          { header: 'Ganancia', dataKey: 'ganancia', width: 55, alignment: 'center' },
          { header: 'Precio Kilo', dataKey: 'precioKilo', width: 55, alignment: 'center' },
        ],
        data,
        fileName: 'Compras',
        pageOrientation: 'landscape',
        showFooter: true,
        footerText:
          'Distribuidora A-E - Sistema de Gestión. Nota: Total incluye transporte y otros gastos.',
      });

      this.notificationService.showSuccess('PDF de compras generado correctamente');
    } catch (error) {
      console.error('Error en downloadPDFCompras:', error);
      this.notificationService.showError('Error al generar el PDF de compras');
    }
  }
  formatDate(date?: string | Date): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return this.datePipe.transform(d, 'dd/MM/yyyy') || '';
    } catch {
      return '';
    }
  }
}

import { Component, computed, effect, inject, Input, signal } from '@angular/core';
import { MovimientoService } from '../../services/movimiento.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Movimiento } from '../../../../core/interfaces/caja.interface';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-movimientos-list',
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './movimientos-list.html',
  styleUrl: './movimientos-list.css',
})
export class MovimientosList {
  public movSvc = inject(MovimientoService);
  searchTerm = signal('');
  total = signal(0);
  pageSize = signal(10);
  currentPage = signal(1);
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  itemsPerPage = 10;

  cajaId!: number;

  columns = [
    { key: 'fecha', label: 'FECHA' },
    { key: 'tipo', label: 'TIPO' },
    { key: 'monto', label: 'MONTO' },
    { key: 'metodoPago', label: 'MÉTODO' },
    { key: 'descripcion', label: 'DESCRIPCIÓN' },
  ];

  filteredMovimientos = computed(() => {
    let arr = this.movSvc.movimientos();

    const term = (this.searchTerm() ?? '').toLowerCase();
    if (!term) return arr;

    return arr.filter((p) => {
      return (
        p.fecha
          ? new Date(p.fecha).toLocaleDateString('es-BO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : ''
      )
        .toLowerCase()
        .includes(term.toLowerCase());
    });
  });
  ordenarMovimientos() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.movSvc.movimientos()];

    arr.sort((a, b) => {
      const valA = a[col as keyof Movimiento];
      const valB = b[col as keyof Movimiento];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });
    this.movSvc.movimientos.set(arr);
  }

  sort(column: string) {
    console.log(column);
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    this.ordenarMovimientos();
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.cajaId = Number(params.get('id'));
      console.log('Caja ID:', this.cajaId);
    });
    if (this.cajaId) {
      this.movSvc.loadByCaja(this.cajaId);
      this.movSvc.loadTotales(this.cajaId);
    }
  }
  constructor(private route: ActivatedRoute) {
    // debug signals
    effect(() => {
      console.log('Movimientos:', this.movSvc.movimientos());

      console.log('Totales:', this.movSvc.totales());
      this.total.set(this.movSvc.total());
      this.pageSize.set(this.movSvc.pageSize());
      this.currentPage.set(this.movSvc.page());
    });
  }
  get movimientosList(): Movimiento[] {
    return this.movSvc.movimientos() || [];
  }

  getTotalIngresos(): number {
    return this.movSvc
      .movimientos()
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0);
  }

  getTotalEgresos(): number {
    return this.movSvc
      .movimientos()
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0);
  }

  getBalance(): number {
    return this.getTotalIngresos() - this.getTotalEgresos();
  }

  rangeStart(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    const end = this.currentPage() * this.pageSize();
    return end > this.total() ? this.total() : end;
  }

  pageArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.movSvc.movimientos();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update((v) => v - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.movSvc.movimientos();
    }
  }
  totalPages() {
    return Math.ceil(this.total() / this.pageSize());
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { faCow, faEye, faPenToSquare, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';

import { FaenaService } from '../../services/faena.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-faena-list',
  imports: [CommonModule, FontAwesomeModule, RouterModule,FormsModule],
  templateUrl: './faena-list.html',
  styleUrl: './faena-list.css',
})
export class FaenaList {
  private faenaService = inject(FaenaService);

  faenas = signal<any[]>([]);

  currentPage = signal(1);
  pageSize = signal(10);

  // Iconos FontAwesome
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faSearch = faSearch;
  faCow=faCow;

  searchTerm = signal('');
  columns = [
    { key: 'id', label: '#' },
    { key: 'compraId', label: 'ID Compra' },
    { key: 'propiedad', label: 'Propiedad' },
    { key: 'numeroReses', label: 'Número de Reses' },
    { key: 'precioDevolucion', label: 'Precio Devolución' },
    { key: 'totalDevolucion', label: 'Total Devolución' },
    { key: 'otrosGastos', label: 'Otros Gastos' },
    { key: 'saldoDepositar', label: 'Saldo a Depositar' }
  ];

  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  _notificationService = inject(NotificationService);
  constructor() {
    this.loadFaenas();
  }

  loadFaenas() {
    this.faenaService.list().subscribe({
      next: (res) => this.faenas.set(res),
      error: (err) => console.error('Error cargando faenas', err),
    });
  }
  ordenarProveedores() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.faenas()];

    arr.sort((a, b) => {
      const valA = a[col as keyof any];
      const valB = b[col as keyof any
      ];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });

    this.faenas.set(arr);
  }

  //paginador
  sort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    // Ordenar localmente, sin recargar desde backend
    this.ordenarProveedores();
  }
  filteredFaenas = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.faenas().filter(
      (f) => f.propiedad.toLowerCase().includes(term) || f.compraId.toString().includes(term)
    );
  });



  totalPages() {
   return Math.ceil(this.total() / this.pageSize());
  }
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.loadFaenas();
    }
  }
  pageArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.loadFaenas();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) this.currentPage.set(page);
  }

  rangeStart(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    const end = this.currentPage() * this.pageSize();
    return end > this.total() ? this.total() : end;
  }

  total() {
    return this.filteredFaenas().length;
  }

  delete(data: any) {
    this._notificationService.confirmDelete(`Se eliminara a  ${data}`).then((result) => {
      if (result.isConfirmed) {
        this.faenaService.delete(data.id).subscribe({
          next: () => {
            this.faenas.update((list) => list.filter((f) => f.id !== data.id));
          },
          error: (err) => console.error('Error eliminando faena', err),
        });
        this._notificationService.showSuccess('Eliminado correctamente');
      }
    });
  }
}

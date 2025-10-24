import { Component, computed, inject, signal } from '@angular/core';
import { PagoService } from '../../services/pago.service';
import { CommonModule } from '@angular/common';
import {
  faAlignLeft,
  faDollarSign,
  faEye,
  faFileExcel,
  faFingerprint,
  faMoneyBill,
  faMoneyBillWave,
  faPenToSquare,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

interface Payment {
  id: number;
  compraId: number;
  descripcion: string;
  monto: string;
  uuid: string;
}
@Component({
  selector: 'app-pago-list',
  imports: [CommonModule, ReactiveFormsModule, FormsModule,FontAwesomeModule],
  templateUrl: './pago-list.html',
  styleUrl: './pago-list.css',
})
export class PagoList {
  private _pagoService = inject(PagoService);
  ngOnInit() {
    this.loadPagos();
  }
  constructor() {
    this.loadPagos();
  }
  pagos = signal<any[]>([]);
  loadPagos() {
    this._pagoService.getAll().subscribe({
      next: (resp) => {
         this.total.set(resp.total);
        console.log(resp.data);
        this.pagos.set(resp.data);
      },
    });
  }

  faMoneyBillWave = faMoneyBillWave;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faFileExcel = faFileExcel;
  faPlus = faPlus;
  faDollarSign = faDollarSign;
  faAlignLeft = faAlignLeft;
  faFingerprint = faFingerprint;
  faMoney=faMoneyBill

  columns = [
    { key: 'id', label: 'N°' },
    { key: 'compra', label: 'Codigo Compra' },
    { key: 'compra.Id', label: 'ID Compra' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'monto', label: 'Monto (Bs.)' },
  ];

  searchTerm = signal('');
  sortColumn = signal<any>('id');
  sortDirection = signal<any>('asc');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  filteredPayments = computed(() => {
    let arr = this.pagos();

    const term = (this.searchTerm() ?? '').toLowerCase();

    console.log(term);

    if (!term) return arr;

    return arr.filter((p) => {
      return (p.compra.codigo || '').toLowerCase().includes(term);
    });
  });
  sort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    this.ordenarPagosCompra()
  }
  ordenarPagosCompra() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;
    const arr = [...this.pagos()];

    arr.sort((a, b) => {
      const valA = a[col as keyof any];
      const valB = b[col as keyof any];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });
    this.pagos.set(arr);
  }
  total = signal(0);
  pageSize = signal(10);

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
    }
  }
  totalPages() {
    return Math.ceil(this.total() / this.pageSize());
  }

  goToPage(page: number) {
    this.currentPage.set(page);
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

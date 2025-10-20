import { Component, computed, inject, signal } from '@angular/core';
import { PagoService } from '../../services/pago.service';
import { CommonModule } from '@angular/common';
import { faAlignLeft, faDollarSign, faEye, faFileExcel, faFingerprint, faMoneyBillWave, faPenToSquare, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Payment {
  id: number;
  compraId: number;
  descripcion: string;
  monto: string;
  uuid: string;
}
@Component({
  selector: 'app-pago-list',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './pago-list.html',
  styleUrl: './pago-list.css',
})
export class PagoList {




  private _pagoService = inject(PagoService);
  ngOnInit() {
    console.log(this.loadPagos())
 
  }
  constructor() {
       this.loadPagos()
  }
  pagos= signal<any[]>([]);
  loadPagos() {
    this._pagoService.getAll().subscribe({
      next: (resp) => {
        console.log(resp.data)
        this.pagos.set( resp.data);
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

  // Datos
  payments = signal<Payment[]>([
    {
      id: 1,
      compraId: 1,
      descripcion: 'Pago por compra de ganado código C-202510-0001 al proveedor csimon llano (20 reses), incluye transporte y otros gastos',
      monto: '60000',
      uuid: '16e4f52b-d670-4293-9c57-f1350e4fb4eb'
    }
    // Agrega más pagos aquí
  ]);

  // Configuración de columnas
  columns = [
    { key: 'id' , label: 'N°' },
    { key: 'compraId' , label: 'ID Compra' },
    { key: 'descripcion' , label: 'Descripción' },
    { key: 'monto' , label: 'Monto (Bs.)' },
    { key: 'uuid' , label: 'UUID' }
  ];

  // Búsqueda
  searchTerm = signal('');

  // Ordenamiento
  sortColumn = signal<any>('id');
  sortDirection = signal<any>('asc');

  // Paginación
  currentPage = signal(1);
  itemsPerPage = signal(10);


  // filteredPayments = computed(() => {
  //   const term = this.searchTerm().toLowerCase().trim();
  //   let filtered = this.payments();

  //   if (term) {
  //     filtered = filtered.filter(p =>
  //       p.descripcion?.toLowerCase().includes(term) ||
  //       p.compraId?.toString().includes(term) ||
  //       p.monto?.toString().includes(term) ||
  //       p.uuid?.toLowerCase().includes(term)
  //     );
  //   }

  //   // Ordenamiento
  //   // const sorted = [...filtered].sort((a, b) => {
  //   //   const col = this.sortColumn();
  //   //   const dir = this.sortDirection();
  //   //   let aVal: any = a[col];
  //   //   let bVal: any = b[col];

  //   //   // Convertir monto a número para ordenamiento correcto
  //   //   if (col === 'monto') {
  //   //     aVal = parseFloat(aVal) || 0;
  //   //     bVal = parseFloat(bVal) || 0;
  //   //   }

  //   //   if (aVal < bVal) return dir === 'asc' ? -1 : 1;
  //   //   if (aVal > bVal) return dir === 'asc' ? 1 : -1;
  //   //   return 0;
  //   // });

  //   return sorted;
  // });


  // paginatedPayments = computed(() => {
  //   const start = (this.currentPage() - 1) * this.itemsPerPage();
  //   const end = start + this.itemsPerPage();
  //   return this.filteredPayments().slice(start, end);
  // });


  // totalPages = computed(() => {
  //   return Math.ceil(this.filteredPayments().length / this.itemsPerPage());
  // });

  
  // pageArray = computed(() => {
  //   const total = this.totalPages();
  //   return Array.from({ length: total }, (_, i) => i + 1);
  // });


  // total = computed(() => this.filteredPayments().length);
  
  // rangeStart = computed(() => {
  //   if (this.total() === 0) return 0;
  //   return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  // });

  // rangeEnd = computed(() => {
  //   const end = this.currentPage() * this.itemsPerPage();
  //   return Math.min(end, this.total());
  // });

  // Métodos de ordenamiento
  toggleSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  // Métodos de paginación
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  // nextPage() {
  //   if (this.currentPage() < this.totalPages()) {
  //     this.currentPage.update(page => page + 1);
  //   }
  // }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  // Métodos de acciones
  view(payment: Payment) {
    console.log('Ver detalle:', payment);
    // Implementa la lógica para ver detalles
  }

  edit(payment: Payment) {
    console.log('Editar:', payment);
    // Implementa la lógica para editar
  }

  delete(payment: Payment) {
    console.log('Eliminar:', payment);
    // Implementa la lógica para eliminar
    if (confirm(`¿Está seguro de eliminar el pago #${payment.id}?`)) {
      this.payments.update(payments => 
        payments.filter(p => p.id !== payment.id)
      );
    }
  }


}

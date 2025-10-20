import { Component, computed, effect, inject, input, signal } from '@angular/core';

import {
  faClipboardList,
  faSearch,
  faEye,
  faPenToSquare,
  faTrash,
  faBoxOpen,
} from '@fortawesome/free-solid-svg-icons';
import { DetalleFaena } from '../../../../core/interfaces/faena.interface';
import { DetalleFaenaService } from '../../services/faena.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-detalle-faena',
  templateUrl: './faena-list.html',
  imports: [FontAwesomeModule, FormsModule, CommonModule, RouterModule],
  styleUrls: ['./faena-list.css'],
})
export class DetalleFaenaComponent {
  // FontAwesome
  faClipboardList = faClipboardList;
  faSearch = faSearch;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faBoxOpen = faBoxOpen;
  detalleFaena: [] = [];

  faenas = signal<DetalleFaena[]>([]);
  searchTerm = signal('');
  itemsPerPage = 10;
  currentPage = signal(1);
  id = input.required<number, string>({
    transform: (value: string) => parseInt(value, 10),
  });


  isModalOpen = signal(false);
  editingFaena = signal<DetalleFaena | null>(null);


  totalPages = computed(() => Math.ceil(this.total() / this.itemsPerPage));

  private route = inject(ActivatedRoute);
  compraId = computed(() => this.id());

  constructor(private faenaService: DetalleFaenaService) {
    this.loadFaenas();
    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get('id') || '0', 10);
    });


    effect(() => {
      console.log('ID cambió:', this.compraId());
      this.searchTerm();
      this.currentPage.set(1);
    });
  }

  loadFaenas() {
    this.faenaService.getAll().subscribe({
      next: (resp) => {
        console.log(resp.data);
        this.faenas.set(resp.data);
      },
    }); 
  
    this.faenaService.detallesFaena(); 
  }


  filteredFaenas() {
    const filtered = this.faenas().filter((f) =>
      f.propiedad.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  total() {
    return this.faenas().filter((f) =>
      f.propiedad.toLowerCase().includes(this.searchTerm().toLowerCase())
    ).length;
  }

  rangeStart() {
    return this.total() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage + 1;
  }

  rangeEnd() {
    return Math.min(this.currentPage() * this.itemsPerPage, this.total());
  }


  pageArray() {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  goToPage(i: number) {
    this.currentPage.set(i);
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update((v) => v - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update((v) => v + 1);
  }

  openModal(faena?: DetalleFaena) {
    this.editingFaena.set(faena ? { ...faena } : null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.editingFaena.set(null);
    this.isModalOpen.set(false);
  }

  saveFaena(faena: DetalleFaena) {
    if (this.editingFaena()) {

      this.faenaService.update(faena.id!, faena).subscribe({
        next: () => {
          this.loadFaenas();
          this.closeModal();
        },
        error: (err) => console.error(err),
      });
    } else {

      this.faenaService.create(faena).subscribe({
        next: () => {
          this.loadFaenas();
          this.closeModal();
        },
        error: (err) => console.error(err),
      });
    }
  }

  edit(faena: DetalleFaena) {
    this.openModal(faena);
  }

  delete(faena: DetalleFaena) {
    if (confirm(`¿Eliminar faena de ${faena.propiedad}?`)) {
      this.faenaService.delete(faena.id!).subscribe({
        next: () => this.loadFaenas(),
        error: (err) => console.error(err),
      });
    }
  }
  columns = [
    { key: '#', label: 'N' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'propiedad', label: 'Propiedad' },
    { key: 'numeroReses', label: 'Número de Reses' },
    { key: 'totalDevolucion', label: 'Total Devolución' },
    { key: 'saldoDepositar', label: 'Saldo a Depositar' },
  ];
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  ordenarFaenas() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.faenas()];

    arr.sort((a, b) => {
      const valA = a[col as keyof DetalleFaena];
      const valB = b[col as keyof DetalleFaena];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });

    this.faenas.set(arr);
  }


  sort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    this.ordenarFaenas();
  }
}

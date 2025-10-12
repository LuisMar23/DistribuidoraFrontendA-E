// src/proveedor/components/proveedor.component.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import departamentos from '../../../../../assets/departamentos.json';
import {
  faBox,
  faBoxOpen,
  faEye,
  faPenToSquare,
  faSearch,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProveedorDto } from '../../../../core/interfaces/suplier.interface';

import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProveedorService } from '../../services/proveedor.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FontAwesomeModule, CommonModule, RouterModule],
  templateUrl: './proveedor.html',
  styleUrl: './proveedor.css',
})
export class ProveedorComponent {
  faBox = faBox;
  faBoxOpen = faBoxOpen;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faSearch = faSearch;
  proveedores = signal<ProveedorDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  departments: string[] = [];
  form: FormGroup;
  editMode = signal(false);

  columns = [
    { key: 'id_proveedor', label: 'N°' },
    { key: 'isActive', label: 'Estado' },
    { key: 'nombre', label: 'Nombre de Proveedor' },
    { key: 'nit_ci', label: 'NIT/CI' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'departamento', label: 'Departamento' },
  ];

  total = signal(0);
  pageSize = signal(10);
  currentPage = signal(1);
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  _notificationService = inject(NotificationService);
  constructor(private proveedorService: ProveedorService, private fb: FormBuilder) {
    this.departments = departamentos.departamentos;

    this.form = this.fb.group({
      nombre: ['', Validators.required],
      nit_ci: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      departamento: ['', Validators.required],
    });

    // Cargar proveedores al inicializar
    this.loadProveedores();
  }

  loadProveedores() {
    this.proveedorService.getAll(this.currentPage(), this.pageSize()).subscribe((res) => {
      this.proveedores.set(res.data);
      this.total.set(res.total);

      // aplicar sort si ya hay columna seleccionada
      if (this.sortColumn()) this.ordenarProveedores();
    });
  }

  filteredProveedores = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.proveedores().filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.nit_ci.toLowerCase().includes(term) ||
        p.telefono.toLowerCase().includes(term)
    );
  });

  submit() {
    if (this.form.invalid) return;

    const data = this.form.value;

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.proveedorService.update(id, data).subscribe(() => {
          this._notificationService.showSuccess(`Se ha actualizado al proveedor`);
          this.loadProveedores();
          this.cancelEdit();
        });
      }
    } else {
      this.proveedorService.create(data).subscribe(() => {
        console.log(data);
        this._notificationService.showSuccess(`Se ha creado al proveedor ${data.nombre}`);
        this.loadProveedores();
        this.cancelEdit();
      });
    }
  }

  edit(proveedor: ProveedorDto) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(proveedor.id_proveedor!);
    this.form.patchValue(proveedor);
  }

  openModal() {
    this.showModal.set(true);
    this.editMode.set(false);
    this.form.reset();
  }

  // Cancelar edición
  cancelEdit() {
    this.showModal.set(false);
    this.editMode.set(false);
    this.editId.set(null);
    this.form.reset();
  }

  // Eliminar proveedor
  delete(data: any) {
    this._notificationService
      .confirmDelete(`Se eliminará al proveedor ${data.nombre}`)
      .then((result) => {
        if (result.isConfirmed) {
          this._notificationService.showSuccess('Eliminado correctamente');
          this.proveedorService.delete(data.id_proveedor).subscribe(() => this.loadProveedores());
        }
      });
  }

  ordenarProveedores() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.proveedores()];

    arr.sort((a, b) => {
      const valA = a[col as keyof ProveedorDto];
      const valB = b[col as keyof ProveedorDto];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });

    this.proveedores.set(arr);
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

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.loadProveedores();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.loadProveedores();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProveedores();
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

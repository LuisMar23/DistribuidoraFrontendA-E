import { Component, computed, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import departamentos from '../../assets/departamentos.json';
import { faBox, faBoxOpen, faEye, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProveedorDto } from '../../core/interfaces/proveedor.interface';
import { ProveedorService } from '../../core/services/proveedor.service';

@Component({
  selector: 'app-proveedor',
  imports: [ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './proveedor.html',
  styleUrl: './proveedor.css',
})
export class ProveedorComponent {
  faBox = faBox;
  faBoxOpen = faBoxOpen;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;

  proveedores = signal<ProveedorDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  departments: string[] = [];
  form: FormGroup;
  editMode = signal(false);

  total = signal(0);
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<keyof ProveedorDto>('creado_en');
  sortDirection = signal<'asc' | 'desc'>('desc');
  constructor(private proveedorService: ProveedorService, private fb: FormBuilder) {
    this.departments = departamentos.departamentos;

    this.form = this.fb.group({
      nombre: ['', Validators.required],
      nit_ci: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      departamento: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    // Cargar proveedores al inicializar
    this.loadProveedores();
  }
  loadProveedores() {
    this.proveedorService
      .getAll(this.currentPage(), this.pageSize(), this.sortColumn(), this.sortDirection())
      .subscribe((res) => {
        this.proveedores.set(res.data);
        this.total.set(res.total);
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
          this.loadProveedores();
          this.cancelEdit();
        });
      }
    } else {
      this.proveedorService.create(data).subscribe(() => {
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
  delete(id: number) {
    if (confirm('¿Desea eliminar este proveedor?')) {
      this.proveedorService.delete(id).subscribe(() => this.loadProveedores());
    }
  }
  view(p: any) {}

  //paginador
  sort(column: keyof ProveedorDto) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.loadProveedores();
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

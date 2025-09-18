import { Component, computed, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProveedorService } from '../services/proveedor.service';
import { ProveedorDto } from '../../interfaces/proveedor.interface';
import departamentos from '../assets/departamentos.json';
import { faBox, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-proveedor',
  imports: [ReactiveFormsModule, FormsModule,FontAwesomeModule],
  templateUrl: './proveedor.html',
  styleUrl: './proveedor.css',
})
export class ProveedorComponent {
    faBox = faBox;
    faBoxOpen=faBoxOpen


  proveedores = signal<ProveedorDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  departments: string[] = [];
  form: FormGroup;
  editMode = signal(false);

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
    this.proveedorService.getAll().subscribe((data) => this.proveedores.set(data));
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
}

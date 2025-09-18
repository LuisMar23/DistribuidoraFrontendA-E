import { Component, computed, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faBox, faBoxOpen, faEye, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TransportService } from '../../core/services/transport.service';
import { CommonModule } from '@angular/common';
import { TransportDto } from '../../core/interfaces/transport.interface';

@Component({
  selector: 'app-transport',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './transport.html',
  styleUrl: './transport.css',
})
export class TransportComponent {
  faBox = faBox;
  faBoxOpen = faBoxOpen;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;

  transportes = signal<TransportDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  form: FormGroup;
  editMode = signal(false);

  total = signal(0);
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<keyof TransportDto>('fecha_salida');
  sortDirection = signal<'asc' | 'desc'>('desc');

  constructor(private transportService: TransportService, private fb: FormBuilder) {
    this.form = this.fb.group({
      id_compra: [0, Validators.required],
      transportista: ['', Validators.required],
      vehiculo: ['', Validators.required],
      costo_local: [0, Validators.required],
      costo_departamental: [0, Validators.required],
      fecha_salida: ['', Validators.required],
      fecha_llegada: ['', Validators.required],
      estado: ['en_camino', Validators.required],
    });

    this.loadTransportes();
  }

  loadTransportes() {
    this.transportService.getAll().subscribe((data: TransportDto[]) => {
      this.transportes.set(data);
      this.total.set(data.length);
    });
  }

  filteredTransportes = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.transportes().filter(
      (t) =>
        (t.transportista || '').toLowerCase().includes(term) ||
        (t.vehiculo || '').toLowerCase().includes(term) ||
        (t.estado || '').toLowerCase().includes(term)
    );
  });

  submit() {
    if (this.form.invalid) return;

    const data = this.form.value;

    if (data.fecha_salida) {
      data.fecha_salida = new Date(data.fecha_salida).toISOString();
    }
    if (data.fecha_llegada) {
      data.fecha_llegada = new Date(data.fecha_llegada).toISOString();
    }

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.transportService.update(id, data).subscribe(() => {
          this.loadTransportes();
          this.cancelEdit();
        });
      }
    } else {
      this.transportService.create(data).subscribe(() => {
        this.loadTransportes();
        this.cancelEdit();
      });
    }
  }

  edit(transporte: TransportDto) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(transporte.id_transporte!);
    
    const formData = {
      ...transporte,
      fecha_salida: this.formatDateForInput(transporte.fecha_salida),
      fecha_llegada: this.formatDateForInput(transporte.fecha_llegada)
    };
    
    this.form.patchValue(formData);
  }

  private formatDateForInput(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  openModal() {
    this.showModal.set(true);
    this.editMode.set(false);
    this.form.reset({
      estado: 'en_camino'
    });
  }

  cancelEdit() {
    this.showModal.set(false);
    this.editMode.set(false);
    this.editId.set(null);
    this.form.reset({
      estado: 'en_camino'
    });
  }

  delete(id: number) {
    if (confirm('¿Desea eliminar este transporte?')) {
      this.transportService.delete(id).subscribe(() => this.loadTransportes());
    }
  }

  view(t: TransportDto) {
  }

  sort(column: keyof TransportDto) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
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
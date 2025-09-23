import { Component, computed, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faShoppingCart, faEye, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VentaService } from '../core/services/venta.service';
import { CommonModule } from '@angular/common';
import { VentaDto, DetalleVentaDto } from '../core/interfaces/venta.interface';

@Component({
  selector: 'app-venta',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './venta.html',
  styleUrl: './venta.css',
})
export class VentaComponent {
  faShoppingCart = faShoppingCart;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;

  ventas = signal<VentaDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  form: FormGroup;
  editMode = signal(false);

  total = signal(0);
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<keyof VentaDto>('fecha_venta');
  sortDirection = signal<'asc' | 'desc'>('desc');

  constructor(private ventaService: VentaService, private fb: FormBuilder) {
    this.form = this.fb.group({
      id_cliente: [0, Validators.required],
      id_usuario: [0, Validators.required],
      fecha_venta: ['', Validators.required],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      metodo_pago: ['efectivo', Validators.required],
      estado: ['pendiente', Validators.required],
      reciboUrl: [''],
      detalles: this.fb.array([])
    });

    this.loadVentas();
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  addDetalle(detalle?: DetalleVentaDto): void {
    const detalleForm = this.fb.group({
      productoId: [detalle?.productoId || 0, Validators.required],
      cantidad: [detalle?.cantidad || 0, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [detalle?.precioUnitario || 0, [Validators.required, Validators.min(0.01)]]
    });
    this.detalles.push(detalleForm);
  }

  removeDetalle(index: number): void {
    this.detalles.removeAt(index);
  }

  loadVentas() {
    this.ventaService.getAll().subscribe((data: VentaDto[]) => {
      this.ventas.set(data);
      this.total.set(data.length);
    });
  }

  filteredVentas = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.ventas().filter(
      (v) =>
        (v.metodo_pago || '').toLowerCase().includes(term) ||
        (v.estado || '').toLowerCase().includes(term) ||
        (v.cliente?.nombre || '').toLowerCase().includes(term)
    );
  });

  getEstadoClass(estado: string): string {
    const classes = {
      'pendiente': 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize',
      'pagado': 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize',
      'anulado': 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize'
    };
    return classes[estado as keyof typeof classes] || classes.pendiente;
  }

  submit() {
    if (this.form.invalid) return;

    const data = this.form.value;

    if (data.fecha_venta) {
      data.fecha_venta = new Date(data.fecha_venta).toISOString();
    }

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.ventaService.update(id, data).subscribe(() => {
          this.loadVentas();
          this.cancelEdit();
        });
      }
    } else {
      this.ventaService.create(data).subscribe(() => {
        this.loadVentas();
        this.cancelEdit();
      });
    }
  }

  edit(venta: VentaDto) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(venta.id_venta!);
    
    // Limpiar detalles anteriores
    while (this.detalles.length !== 0) {
      this.detalles.removeAt(0);
    }

    const formData = {
      ...venta,
      fecha_venta: this.formatDateForInput(venta.fecha_venta)
    };
    
    this.form.patchValue(formData);

    // Agregar detalles si existen
    if (venta.detalles) {
      venta.detalles.forEach(detalle => this.addDetalle(detalle));
    }
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
      metodo_pago: 'efectivo',
      estado: 'pendiente',
      subtotal: 0,
      descuento: 0,
      total: 0
    });
    // Limpiar detalles
    while (this.detalles.length !== 0) {
      this.detalles.removeAt(0);
    }
    // Agregar un detalle vacío por defecto
    this.addDetalle();
  }

  cancelEdit() {
    this.showModal.set(false);
    this.editMode.set(false);
    this.editId.set(null);
    this.form.reset({
      metodo_pago: 'efectivo',
      estado: 'pendiente'
    });
    // Limpiar detalles
    while (this.detalles.length !== 0) {
      this.detalles.removeAt(0);
    }
  }

  delete(id: number) {
    if (confirm('¿Desea eliminar esta venta?')) {
      this.ventaService.delete(id).subscribe(() => this.loadVentas());
    }
  }

  view(venta: VentaDto) {
    // Implementar vista detallada
    console.log('Ver venta:', venta);
  }

  sort(column: keyof VentaDto) {
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
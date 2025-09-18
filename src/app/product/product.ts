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
import { ProductService } from '../../core/services/product.service';
import { CommonModule } from '@angular/common';
import { ProductDto } from '../../core/interfaces/product.interface';

@Component({
  selector: 'app-product',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class ProductComponent {
  faBox = faBox;
  faBoxOpen = faBoxOpen;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;

  products = signal<ProductDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  form: FormGroup;
  editMode = signal(false);

  total = signal(0);
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<keyof ProductDto>('creado_en');
  sortDirection = signal<'asc' | 'desc'>('desc');

  constructor(private productService: ProductService, private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['', Validators.required],
      unidad_medida: ['', Validators.required],
      stock_actual: [0, [Validators.required, Validators.min(0)]],
      precio_base: [0, [Validators.required, Validators.min(0)]],
      estado: [true, Validators.required],
    });

    this.loadProducts();
  }

  loadProducts() {
    this.productService.getAll().subscribe((data: ProductDto[]) => {
      this.products.set(data);
      this.total.set(data.length);
    });
  }

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.products().filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(term) ||
        (p.categoria || '').toLowerCase().includes(term) ||
        (p.unidad_medida || '').toLowerCase().includes(term)
    );
  });

  submit() {
    if (this.form.invalid) {
      console.log('Formulario inválido');
      return;
    }

    let data = this.form.value;

    // ✅ Conversión de estado string → boolean
    if (typeof data.estado === 'string') {
      data.estado = data.estado === 'true';
    }

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.productService.update(id, data).subscribe({
          next: (result) => {
            console.log('Producto actualizado:', result);
            this.loadProducts();
            this.cancelEdit();
          },
          error: (error) => {
            console.error('Error al actualizar producto:', error);
            alert('Error al actualizar el producto. Verifica la consola para más detalles.');
          }
        });
      }
    } else {
      this.productService.create(data).subscribe({
        next: (result) => {
          console.log('Producto creado:', result);
          this.loadProducts();
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error al crear producto:', error);
          alert('Error al crear el producto. Verifica la consola para más detalles.');
        }
      });
    }
  }

  edit(product: ProductDto) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(product.id_producto!);

    this.form.patchValue({
      nombre: product.nombre,
      categoria: product.categoria,
      unidad_medida: product.unidad_medida,
      stock_actual: product.stock_actual,
      precio_base: product.precio_base,
      estado: product.estado
    });
  }

  openModal() {
    this.showModal.set(true);
    this.editMode.set(false);
    this.form.reset({
      estado: true,
      stock_actual: 0,
      precio_base: 0
    });
  }

  cancelEdit() {
    this.showModal.set(false);
    this.editMode.set(false);
    this.editId.set(null);
    this.form.reset({
      estado: true,
      stock_actual: 0,
      precio_base: 0
    });
  }

  delete(id: number) {
    if (confirm('¿Desea eliminar este producto?')) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.loadProducts();
          console.log('Producto eliminado correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar producto:', error);
          alert('Error al eliminar el producto. Verifica la consola para más detalles.');
        }
      });
    }
  }

  view(p: ProductDto) {
    console.log('Ver producto:', p);
  }

  sort(column: keyof ProductDto) {
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

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
}

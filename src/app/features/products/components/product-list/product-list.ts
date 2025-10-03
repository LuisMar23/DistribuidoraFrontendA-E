import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBoxes,
  faBoxOpen,
  faDrumstickBite,
  faEye,
  faPenToSquare,
  faPlus,
  faSearch,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { ProductService } from '../../services/product.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductDto } from '../../../../core/interfaces/product.interface';

@Component({
  selector: 'app-product-list',
  imports: [FontAwesomeModule, CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  faBoxes = faBoxes;
  faSearch = faSearch;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faBoxOpen = faBoxOpen;
  faEye = faEye;
 faDrumstickBite=faDrumstickBite;
 faPlus=faPlus;
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  private productoService = inject(ProductService);
  productos = signal<ProductDto[]>([]);
  // Signals

  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = 10;
  columns = [
    { key: 'id_producto', label: 'N°' },
    { key: 'imagen', label: 'Imagen' },
    { key: 'estado', label: 'Estado' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'unidad_medida', label: 'Unidad Medida' },
    { key: 'stock_actual', label: 'Stock' },
    { key: 'precio_base', label: 'Precio' },

  ];

  // Computed filtered & paginated
  filteredProductos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.productos()
      .filter((p) => p.nombre.toLowerCase().includes(term))
      .slice(this.rangeStart() - 1, this.rangeEnd());
  });

  // Pagination helpers
  total = computed(() => this.productos().length);
  totalPages = computed(() => Math.ceil(this.total() / this.itemsPerPage));

  rangeStart() {
    return (this.currentPage() - 1) * this.itemsPerPage + 1;
  }

  rangeEnd() {
    return Math.min(this.currentPage() * this.itemsPerPage, this.total());
  }

  pageArray() {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update((n) => n - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update((n) => n + 1);
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  constructor() {
    this.loadProductos();
  }

  // Cargar productos desde el servicio
  loadProductos() {
    this.productoService.list().subscribe({
      next: (res) => this.productos.set(res),
      error: (err) => console.error('Error cargando productos', err),
    });
  }

  // Acciones
  edit(producto: any) {
    console.log('Editar', producto);
    // Aquí podrías abrir un modal o navegar a la página de edición
  }

  delete(producto: any) {
    if (!confirm(`¿Seguro que deseas eliminar el producto "${producto.nombre}"?`)) return;
    this.productoService.remove(producto.id_producto).subscribe({
      next: () => {
        alert('Producto eliminado');
        this.loadProductos();
      },
      error: (err) => console.error(err),
    });
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
    this.ordenarProducts();
  }
  ordenarProducts() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.productos()];

    arr.sort((a, b) => {
      const valA = a[col as keyof ProductDto];
      const valB = b[col as keyof ProductDto];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });

    this.productos.set(arr);
  }
  openModal() {}
}

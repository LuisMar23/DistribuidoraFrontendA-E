import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductDto } from '../../../../core/interfaces/product.interface';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {
  // Señales principales
  products = signal<ProductDto[]>([]);
  allProducts = signal<ProductDto[]>([]);
  searchTerm = signal<string>('');

  // Señales de estado
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  // Señales de paginación y ordenamiento
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  total = signal<number>(0);
  sortColumn = signal<keyof ProductDto>('id_producto');
  sortDirection = signal<'asc' | 'desc'>('desc');

  private productSvc = inject(ProductService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.cargando.set(true);
    this.error.set(null);
    this.productSvc.getAll().subscribe({
      next: (products) => {
        this.allProducts.set(products);
        this.total.set(products.length);
        this.applyFilterAndSort();
        this.cargando.set(false);
      },
      error: (err) => {

        this.error.set('No se pudieron cargar los productos');
        this.cargando.set(false);
      },
    });
  }

  private applyFilterAndSort() {
    let filtered = this.allProducts();

    // Aplicar filtro de búsqueda
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(
        (p) =>
          p.codigo?.toLowerCase().includes(term) ||
          p.observacion?.toLowerCase().includes(term) ||
          p.id_producto?.toString().includes(term) ||
          p.peso?.toString().includes(term) ||
          (p.estado ? 'activo' : 'inactivo').includes(term)
      );
    }

    // Aplicar ordenamiento
    const sorted = this.sortProducts(filtered);

    // Aplicar paginación
    const paginated = this.paginateProducts(sorted);
    this.products.set(paginated);
  }

  private sortProducts(products: ProductDto[]): ProductDto[] {
    const column = this.sortColumn();
    if (!column) {
      return products;
    }

    return products.sort((a, b) => {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;

      let aValue: any = a[column];
      let bValue: any = b[column];

      // Manejar valores undefined/null
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      // Ordenar por fechas
      if (column === 'fecha_llegada' || column === 'creado_en') {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return direction * (dateA - dateB);
      }

      // Ordenar por números (ID, peso)
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction * (aValue - bValue);
      }

      // Ordenar por booleanos (estado)
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return direction * (aValue === bValue ? 0 : aValue ? 1 : -1);
      }

      // Ordenar por texto
      return direction * aValue.toString().localeCompare(bValue.toString());
    });
  }

  private paginateProducts(products: ProductDto[]): ProductDto[] {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return products.slice(startIndex, endIndex);
  }

  // Computed para productos filtrados
  filteredProducts = computed(() => {
    return this.products();
  });

  // Métodos de ordenamiento
  sort(column: keyof ProductDto) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
    this.applyFilterAndSort();
  }

  // Métodos de búsqueda - CORREGIDO
  onSearchChange() {
    this.currentPage.set(1); // Resetear a primera página al buscar
    this.applyFilterAndSort();
  }

  // Métodos de paginación
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.applyFilterAndSort();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.applyFilterAndSort();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.applyFilterAndSort();
    }
  }

  // Calcular total de páginas
  totalPages(): number {
    const filteredLength = this.getTotalFiltered();
    return Math.ceil(filteredLength / this.pageSize());
  }

  // Array de páginas para el paginador
  pageArray(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // Calcular rango inicial
  rangeStart(): number {
    const filteredLength = this.getTotalFiltered();
    if (filteredLength === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  // Calcular rango final
  rangeEnd(): number {
    const filteredLength = this.getTotalFiltered();
    const end = this.currentPage() * this.pageSize();
    return end > filteredLength ? filteredLength : end;
  }

  // Obtener el total de elementos filtrados
  getTotalFiltered(): number {
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      return this.allProducts().filter(
        (p) =>
          p.codigo?.toLowerCase().includes(term) ||
          p.observacion?.toLowerCase().includes(term) ||
          p.id_producto?.toString().includes(term) ||
          p.peso?.toString().includes(term) ||
          (p.estado ? 'activo' : 'inactivo').includes(term)
      ).length;
    }
    return this.allProducts().length;
  }

  // Métodos existentes
  verDetalles(product: ProductDto) {
    // Implementar lógica de detalles si es necesario
    console.log('Ver detalles:', product);
  }

  cerrarModal() {
    // Implementar lógica de cerrar modal si es necesario
  }

  eliminarProduct(id: number) {
    if (confirm('¿Está seguro que desea eliminar este producto?')) {
      this.productSvc.delete(id).subscribe({
        next: () => {
          // Actualizar la lista local
          this.allProducts.update((list) => list.filter((p) => p.id_producto !== id));
          // Re-aplicar filtros y paginación
          this.applyFilterAndSort();
          this.notificationService.showSuccess('Producto eliminado correctamente');
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          this.notificationService.showError('No se pudo eliminar el producto');
        },
      });
    }
  }

  // Método para compatibilidad con la plantilla existente
  getProductsPaginados(): ProductDto[] {
    return this.products();
  }

  // Método para compatibilidad con la plantilla existente
  getPages(): number[] {
    return this.pageArray();
  }
}

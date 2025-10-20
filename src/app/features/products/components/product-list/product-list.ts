import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductDto } from '../../../../core/interfaces/product.interface';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {
  products = signal<ProductDto[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  page = signal<number>(1);
  pageSize = signal<number>(10);
  totalPages = signal<number>(1);
  productSeleccionado = signal<ProductDto | null>(null);
  mostrarModal = signal<boolean>(false);

  private productSvc = inject(ProductService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.obtenerProducts();
  }

  obtenerProducts() {
    this.cargando.set(true);
    this.error.set(null);
    this.productSvc.getAll().subscribe({
      next: (products) => {
        this.products.set(products);
        this.totalPages.set(Math.ceil(products.length / this.pageSize()));
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.error.set('No se pudieron cargar los productos');
        this.cargando.set(false);
      },
    });
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages()) {
      this.page.set(nuevaPagina);
    }
  }

  verDetalles(product: ProductDto) {
    this.productSeleccionado.set(product);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.productSeleccionado.set(null);
  }

  eliminarProduct(id: number) {
    if (confirm('¿Está seguro que desea eliminar este producto?')) {
      this.productSvc.delete(id).subscribe({
        next: () => {
          this.products.update((list) => list.filter((p) => p.id_producto !== id));
          this.notificationService.showSuccess('Producto eliminado correctamente');
          if (this.productSeleccionado()?.id_producto === id) {
            this.cerrarModal();
          }
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          this.notificationService.showError('No se pudo eliminar el producto');
        },
      });
    }
  }

  getPages(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.page() - 2);
    const endPage = Math.min(this.totalPages(), startPage + 4);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getProductsPaginados(): ProductDto[] {
    const startIndex = (this.page() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.products().slice(startIndex, endIndex);
  }
}

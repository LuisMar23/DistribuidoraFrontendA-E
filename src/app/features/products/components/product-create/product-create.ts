import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductService } from '../../services/product.service';
import { CompraService } from '../../../compras/services/compra.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './product-create.html',
})
export class ProductCreate {
  productForm: FormGroup;
  enviando = signal<boolean>(false);

  router = inject(Router);
  private fb = inject(FormBuilder);
  private productSvc = inject(ProductService);
  private compraSvc = inject(CompraService);
  private notificationService = inject(NotificationService);
  compras = signal<any[]>([]);
  terminoBusqueda = signal<string>('');
  mostrarLista = false;
  constructor() {
    this.cargarCompras();
    this.productForm = this.crearFormularioProducto();
  }

  crearFormularioProducto(): FormGroup {
    return this.fb.group({
      peso: [0, [Validators.required, Validators.min(0.01)]],
      observacion: [''],
      fecha_llegada: [new Date().toISOString().split('T')[0], Validators.required],
      compraGanadoId: [null, Validators.required],
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.notificationService.showError('Complete todos los campos requeridos correctamente.');
      return;
    }

    this.enviando.set(true);

    const productData = {
      ...this.productForm.value,
      peso: Number(this.productForm.value.peso),
      fecha_llegada: new Date(this.productForm.value.fecha_llegada),
    };
    console.log(productData)
    this.productSvc.create(productData).subscribe({
      next: (response) => {
        this.enviando.set(false);
        this.notificationService.showSuccess('Producto creado exitosamente!');
        setTimeout(() => {
          this.router.navigate(['/productos/lista']);
        }, 1000);
      },
      error: (err) => {
        this.enviando.set(false);
        this.notificationService.showError('Error al crear el producto');
      },
    });
  }
  comprasFiltradas = computed(() => {
    const term = this.terminoBusqueda().toLowerCase().trim();
    if (!term) return this.compras();

    return this.compras().filter((c) => {
      const codigoMatch = c.codigo.toLowerCase().includes(term);
      const fechaStr = c.fechaCompra
        ? new Date(c.fechaCompra).toLocaleDateString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '';
      const fechaMatch = fechaStr.toLowerCase().includes(term);

      return codigoMatch || fechaMatch;
    });
  });

  cargarCompras() {
    this.compraSvc.getAll().subscribe({
      next: (res) => this.compras.set(res.data),
      error: (err) => console.error('Error cargando compras', err),
    });
  }

  seleccionarCompra(compra: any) {
    this.productForm.patchValue({   compraGanadoId: compra.id });
    this.terminoBusqueda.set(compra.codigo);
    this.mostrarLista = false;
  }
}

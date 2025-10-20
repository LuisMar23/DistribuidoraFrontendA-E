import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-edit.html',
})
export class ProductEdit implements OnInit {
  productForm: FormGroup;
  productId: number | null = null;
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  enviando = signal<boolean>(false);
  productData: any = null;

  router = inject(Router);
  private fb = inject(FormBuilder);
  private productSvc = inject(ProductService);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  constructor() {
    this.productForm = this.crearFormularioProducto();
  }

  ngOnInit(): void {
    this.obtenerProduct();
  }

  obtenerProduct(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.productId) {
      this.error.set('ID de producto no válido');
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.productSvc.getById(this.productId).subscribe({
      next: (resp) => {
        if (resp) {
          this.productData = resp;
          this.cargarDatosFormulario(resp);
        } else {
          this.error.set('No se encontró el producto');
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar el producto');
        this.cargando.set(false);
      },
    });
  }

  crearFormularioProducto(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      categoria: ['', [Validators.required, Validators.minLength(2)]],
      unidad_medida: ['', [Validators.required, Validators.minLength(1)]],
      stock_actual: [0, [Validators.required, Validators.min(0)]],
      precio_base: [0, [Validators.required, Validators.min(0.01)]],
      estado: [true],
    });
  }

  cargarDatosFormulario(product: any): void {
    this.productForm.patchValue({
      nombre: product.nombre || '',
      categoria: product.categoria || '',
      unidad_medida: product.unidad_medida || '',
      stock_actual: product.stock_actual || 0,
      precio_base: product.precio_base || 0,
      estado: product.estado ?? true,
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.notificationService.showError('Complete todos los campos requeridos correctamente.');
      return;
    }

    if (!this.productId) {
      this.notificationService.showError('ID de producto no válido.');
      return;
    }

    this.enviando.set(true);
    const dataActualizada = {
      ...this.productForm.value,
      stock_actual: Number(this.productForm.value.stock_actual),
      precio_base: Number(this.productForm.value.precio_base),
    };

    this.productSvc.update(this.productId, dataActualizada).subscribe({
      next: (response) => {
        this.enviando.set(false);
        this.notificationService.showSuccess('Producto actualizado exitosamente!');
        setTimeout(() => {
          this.router.navigate(['/productos/lista']);
        }, 1000);
      },
      error: (err) => {
        this.enviando.set(false);
        this.notificationService.showError('Error al actualizar el producto');
      },
    });
  }

  volverAlListado(): void {
    this.router.navigate(['/productos/lista']);
  }
}

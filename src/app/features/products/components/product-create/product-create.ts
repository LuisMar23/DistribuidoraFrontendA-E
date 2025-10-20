import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-create.html',
})
export class ProductCreate {
  productForm: FormGroup;
  enviando = signal<boolean>(false);

  // Router público para usar en el template
  router = inject(Router);
  private fb = inject(FormBuilder);
  private productSvc = inject(ProductService);
  private notificationService = inject(NotificationService);

  constructor() {
    this.productForm = this.crearFormularioProducto();
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

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.notificationService.showError('Complete todos los campos requeridos correctamente.');
      return;
    }

    this.enviando.set(true);

    const productData = {
      ...this.productForm.value,
      stock_actual: Number(this.productForm.value.stock_actual),
      precio_base: Number(this.productForm.value.precio_base),
    };

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
}

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';

import {
  faShoppingCart,
  faArrowLeft,
  faSave,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { VentaService } from '../../services/venta.service';
import { ClientService } from '../../../../core/services/client.service';
import { UserService } from '../../../../core/services/users.service';
import { ProductService } from '../../../../core/services/product.service';
import { ClientDto } from '../../../../core/interfaces/client.interface';
import { UserDto } from '../../../../core/interfaces/user.interface';
import { ProductDto } from '../../../../core/interfaces/product.interface';
import { AuthService } from '../../../../components/services/auth.service';

// Interfaces locales para adaptar los datos
interface ClienteOption {
  id_cliente: number;
  nombre: string;
}

interface UsuarioOption {
  id_usuario: number;
  nombre: string;
}

interface ProductoOption {
  id_producto: number;
  nombre: string;
  precio_venta: number;
  stock: number;
  categoria: string;
  unidad_medida: string;
}

@Component({
  selector: 'app-venta-create',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule, CommonModule],
  templateUrl: './venta-create.html',
  styleUrl: './venta-create.css',
})
export class VentaCreateComponent implements OnInit {
  // Iconos
  faShoppingCart = faShoppingCart;
  faArrowLeft = faArrowLeft;
  faSave = faSave;
  faPlus = faPlus;
  faTrash = faTrash;

  // Services
  private _notificationService = inject(NotificationService);
  private _router = inject(Router);
  private _clienteService = inject(ClientService);
  private _usuarioService = inject(UserService);
  private _productoService = inject(ProductService);
  private _authService = inject(AuthService);
  private _ventaService = inject(VentaService);
  private _fb = inject(FormBuilder);

  // Signals
  isLoading = signal(false);
  clientes = signal<ClienteOption[]>([]);
  usuarioActual = signal<UsuarioOption | null>(null);
  productos = signal<ProductoOption[]>([]);

  // Form
  form: FormGroup;

  // Computed values
  detallesLength = computed(() => this.detalles.length);

  constructor() {
    this.form = this._fb.group({
      id_cliente: ['', Validators.required],
      id_usuario: ['', Validators.required],
      fecha_venta: ['', Validators.required],
      subtotal: [0],
      descuento: [0],
      total: [0],
      metodo_pago: ['efectivo', Validators.required],
      estado: ['pendiente', Validators.required],
      detalles: this._fb.array([]),
    });

    this.setCurrentDateTime();
    this.agregarDetalle();
  }

  ngOnInit() {
    this.loadUsuarioActual();
    this.loadDatos();
  }

  private loadUsuarioActual() {
    const usuario = this._authService.getCurrentUser();

    if (usuario) {
      const usuarioOption: UsuarioOption = {
        id_usuario: usuario.id || usuario.id_usuario || usuario.userId || 1,
        nombre: usuario.nombre || usuario.fullName || usuario.username || 'Usuario actual',
      };

      this.usuarioActual.set(usuarioOption);
      this.form.patchValue({
        id_usuario: usuarioOption.id_usuario,
      });
    } else {
      console.warn('No se encontró usuario autenticado');
      this._notificationService.showError(
        'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.'
      );
    }
  }

  private loadDatos() {
    // Cargar clientes
    this._clienteService.getAll().subscribe({
      next: (clientes: ClientDto[]) => {
        const clientesOptions: ClienteOption[] = clientes.map((cliente) => ({
          id_cliente: cliente.id_cliente || 0,
          nombre: cliente.nombre || 'Cliente sin nombre',
        }));
        this.clientes.set(clientesOptions);
      },
      error: (error) => {
        console.error('Error loading clientes:', error);
        this._notificationService.showError('Error al cargar los clientes');
      },
    });

    // Cargar productos
    this._productoService.getAll().subscribe({
      next: (productos: ProductDto[]) => {
        const productosOptions: ProductoOption[] = productos
          .filter((producto) => producto.estado)
          .map((producto) => ({
            id_producto: producto.id_producto || 0,
            nombre: producto.nombre || 'Producto sin nombre',
            precio_venta: producto.precio_base || 0,
            stock: producto.stock_actual || 0,
            categoria: producto.categoria || '',
            unidad_medida: producto.unidad_medida || '',
          }));
        this.productos.set(productosOptions);
      },
      error: (error) => {
        console.error('Error loading productos:', error);
        this._notificationService.showError('Error al cargar los productos');
      },
    });
  }

  // Getter para el FormArray de detalles
  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  // Calcular subtotal total de todos los productos
  calcularSubtotalTotal(): number {
    let total = 0;
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      const cantidad = Number(detalle.get('cantidad')?.value) || 0;
      const precioUnitario = Number(detalle.get('precio_unitario')?.value) || 0;
      total += cantidad * precioUnitario;
    }
    return total;
  }

  // Calcular total general
  calcularTotalGeneral(): number {
    const subtotal = this.calcularSubtotalTotal();
    const descuento = Number(this.form.get('descuento')?.value) || 0;
    return Math.max(0, subtotal - descuento);
  }

  // Agregar detalle
  agregarDetalle() {
    const detalleForm = this._fb.group({
      id_producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [0, [Validators.required, Validators.min(0)]],
    });

    this.detalles.push(detalleForm);
  }

  // Eliminar detalle
  eliminarDetalle(index: number) {
    this.detalles.removeAt(index);
    this.actualizarTotales();
  }

  // Cuando se selecciona un producto, cargar su precio
  onProductoSeleccionado(index: number) {
    const detalle = this.detalles.at(index);
    const idProducto = detalle.get('id_producto')?.value;

    if (idProducto) {
      const producto = this.productos().find((p) => p.id_producto === parseInt(idProducto));
      if (producto) {
        detalle.patchValue({
          precio_unitario: producto.precio_venta,
        });
        this.calcularSubtotalDetalle(index);
      }
    }
  }

  // Validar stock disponible
  validarStock(index: number): boolean {
    const detalle = this.detalles.at(index);
    const idProducto = detalle.get('id_producto')?.value;
    const cantidad = detalle.get('cantidad')?.value || 0;

    if (idProducto) {
      const producto = this.productos().find((p) => p.id_producto === parseInt(idProducto));
      if (producto && cantidad > producto.stock) {
        this._notificationService.showError(
          `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`
        );
        detalle.patchValue({ cantidad: producto.stock });
        this.calcularSubtotalDetalle(index);
        return false;
      }
    }
    return true;
  }

  // Calcular subtotal de un detalle
  calcularSubtotalDetalle(index: number) {
    if (index < 0 || index >= this.detalles.length) return;

    const detalle = this.detalles.at(index);
    const cantidad = Number(detalle.get('cantidad')?.value) || 0;
    const precioUnitario = Number(detalle.get('precio_unitario')?.value) || 0;
    const subtotal = cantidad * precioUnitario;

    detalle.patchValue({ subtotal: subtotal }, { emitEvent: false });
    this.actualizarTotales();
  }

  // Actualizar totales
  actualizarTotales() {
    const subtotal = this.calcularSubtotalTotal();
    const total = this.calcularTotalGeneral();

    this.form.patchValue({
      subtotal: subtotal,
      total: total
    });
  }

  onDescuentoChange() {
    this.actualizarTotales();
  }

  private setCurrentDateTime() {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    this.form.patchValue({
      fecha_venta: formattedDate,
    });
  }

  submit() {
    // Marcar todos los campos como touched para mostrar errores
    this.form.markAllAsTouched();

    // Asegurar que los totales estén actualizados
    this.actualizarTotales();

    // Validar detalles
    let detallesValidos = true;
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      detalle.markAllAsTouched();
      
      if (detalle.invalid) {
        detallesValidos = false;
        const idProducto = detalle.get('id_producto')?.value;
        if (!idProducto) {
          this._notificationService.showError(`Seleccione un producto para la línea ${i + 1}`);
          return;
        }
      }
    }

    if (this.form.invalid || !detallesValidos) {
      this._notificationService.showError('Por favor, complete todos los campos requeridos correctamente');
      return;
    }

    if (this.detalles.length === 0) {
      this._notificationService.showError('Debe agregar al menos un producto a la venta');
      return;
    }

    if (!this.usuarioActual()) {
      this._notificationService.showError(
        'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.'
      );
      return;
    }

    // Validar stock final antes de enviar
    for (let i = 0; i < this.detalles.length; i++) {
      if (!this.validarStock(i)) {
        return;
      }
    }

    this.isLoading.set(true);

    // Preparar datos para enviar
    const formData = this.form.value;

    // Formatear fecha
    const fechaVentaFormateada = formData.fecha_venta.length === 16 
      ? formData.fecha_venta + ':00' 
      : formData.fecha_venta;

    const ventaData = {
      id_cliente: parseInt(formData.id_cliente),
      id_usuario: this.usuarioActual()!.id_usuario,
      fecha_venta: fechaVentaFormateada,
      subtotal: parseFloat(formData.subtotal) || 0,
      descuento: parseFloat(formData.descuento) || 0,
      total: parseFloat(formData.total) || 0,
      metodo_pago: formData.metodo_pago,
      estado: formData.estado,
      detalles: formData.detalles.map((detalle: any) => ({
        productoId: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precioUnitario: parseFloat(detalle.precio_unitario),
      }))
    };

    console.log('Datos a enviar al backend:', ventaData);

    this._ventaService.create(ventaData).subscribe({
      next: (response) => {
        this._notificationService.showSuccess('Venta creada exitosamente');
        this.isLoading.set(false);
        this._router.navigate(['/ventas']);
      },
      error: (error) => {
        console.error('Error creating venta:', error);
        let errorMessage = 'Error al crear la venta';
        
        if (error.error?.message) {
          errorMessage += ': ' + error.error.message;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }
        
        this._notificationService.showError(errorMessage);
        this.isLoading.set(false);
      },
    });
  }

  cancel() {
    this._router.navigate(['/ventas']);
  }
}
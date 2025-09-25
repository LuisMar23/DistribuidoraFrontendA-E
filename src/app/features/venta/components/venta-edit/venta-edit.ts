import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';

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
import { VentaDto } from '../../../../core/interfaces/venta.interface';

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
  selector: 'app-venta-edit',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule, CommonModule, DecimalPipe],
  templateUrl: './venta-edit.html',
  styleUrl: './venta-edit.css',
})
export class VentaEditComponent implements OnInit {
  // Iconos
  faShoppingCart = faShoppingCart;
  faArrowLeft = faArrowLeft;
  faSave = faSave;
  faPlus = faPlus;
  faTrash = faTrash;

  // Services
  private _notificationService = inject(NotificationService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
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
  ventaId = signal<number | null>(null);
  datosCargados = signal(false);

  // Form
  form: FormGroup;

  // Computed values
  detallesLength = computed(() => this.detalles.length);
  subtotalTotal = computed(() => {
    const total = this.detalles.controls.reduce((total, detalle) => {
      const subtotal = parseFloat(detalle.get('subtotal')?.value) || 0;
      return total + subtotal;
    }, 0);
    return total;
  });

  totalGeneral = computed(() => {
    const descuento = parseFloat(this.form.get('descuento')?.value) || 0;
    const subtotal = this.subtotalTotal();
    const total = Math.max(0, subtotal - descuento);
    return total;
  });

  constructor() {
    this.form = this._fb.group({
      id_cliente: ['', Validators.required],
      id_usuario: ['', Validators.required],
      fecha_venta: ['', Validators.required],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      metodo_pago: ['efectivo', Validators.required],
      estado: ['pendiente', Validators.required],
      detalles: this._fb.array([]), // Sin validators required inicial
    });
  }

  ngOnInit() {
    this.loadUsuarioActual();
    this.loadDatos();
  }

  private loadDatos() {
    // Cargar clientes y productos primero
    this.isLoading.set(true);

    // Cargar clientes
    this._clienteService.getAll().subscribe({
      next: (clientes: ClientDto[]) => {
        const clientesOptions: ClienteOption[] = clientes.map((cliente) => ({
          id_cliente: cliente.id_cliente || 0,
          nombre: cliente.nombre || 'Cliente sin nombre',
        }));
        this.clientes.set(clientesOptions);

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

            // Una vez cargados los productos, cargar la venta
            this.loadVenta();
          },
          error: (error) => {
            console.error('Error loading productos:', error);
            this._notificationService.showError('Error al cargar los productos');
            this.isLoading.set(false);
          },
        });
      },
      error: (error) => {
        console.error('Error loading clientes:', error);
        this._notificationService.showError('Error al cargar los clientes');
        this.isLoading.set(false);
      },
    });
  }

  private loadVenta() {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this.ventaId.set(parseInt(id));

      this._ventaService.getById(parseInt(id)).subscribe({
        next: (venta: VentaDto) => {
          this.cargarDatosVenta(venta);
          this.datosCargados.set(true);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading venta:', error);
          this._notificationService.showError('Error al cargar la venta');
          this.isLoading.set(false);
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  private cargarDatosVenta(venta: VentaDto) {
    console.log('Cargando venta:', venta);

    // Formatear fecha para el input datetime-local
    const fechaVenta = new Date(venta.fecha_venta);
    const fechaFormateada = fechaVenta.toISOString().slice(0, 16);

    // Cargar los detalles de la venta
    if (venta.detalles && venta.detalles.length > 0) {
      this.detalles.clear();
      venta.detalles.forEach((detalle) => {
        this.agregarDetalleConDatos(detalle);
      });
    }

    // Cargar el resto del formulario
    this.form.patchValue({
      id_cliente: venta.id_cliente.toString(),
      id_usuario: venta.id_usuario.toString(),
      fecha_venta: fechaFormateada,
      subtotal: venta.subtotal,
      descuento: venta.descuento || 0,
      total: venta.total,
      metodo_pago: venta.metodo_pago,
      estado: venta.estado,
    });

    // Forzar cálculo y actualización de totales
    this.actualizarTotalesFormulario();
  }

  private actualizarTotalesFormulario() {
    const subtotal = this.subtotalTotal();
    const total = this.totalGeneral();

    this.form.patchValue(
      {
        subtotal: subtotal,
        total: total,
      },
      { emitEvent: false }
    ); // Evitar bucles de actualización

    console.log('Totales calculados - Subtotal:', subtotal, 'Total:', total);
  }

  private loadUsuarioActual() {
    const usuario = this._authService.getCurrentUser();

    if (usuario) {
      const usuarioOption: UsuarioOption = {
        id_usuario: usuario.id || usuario.id_usuario || usuario.userId || 1,
        nombre: usuario.nombre || usuario.fullName || usuario.username || 'Usuario actual',
      };

      this.usuarioActual.set(usuarioOption);
    } else {
      console.warn('No se encontró usuario autenticado');
    }
  }

  // Getter para el FormArray de detalles
  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  // Agregar detalle vacío
  agregarDetalle() {
    const detalleForm = this._fb.group({
      id_producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [0, [Validators.required, Validators.min(0)]],
    });

    this.detalles.push(detalleForm);
  }

  // Agregar detalle con datos existentes
  agregarDetalleConDatos(detalle: any) {
    console.log('Agregando detalle:', detalle);

    const detalleForm = this._fb.group({
      id_producto: [
        detalle.id_producto?.toString() || detalle.productoId?.toString() || '',
        Validators.required,
      ],
      cantidad: [detalle.cantidad || 1, [Validators.required, Validators.min(1)]],
      precio_unitario: [
        detalle.precio_unitario || detalle.precioUnitario || 0,
        [Validators.required, Validators.min(0)],
      ],
      subtotal: [detalle.subtotal || 0, [Validators.required, Validators.min(0)]],
    });

    this.detalles.push(detalleForm);
  }

  // Eliminar detalle
  eliminarDetalle(index: number) {
    this.detalles.removeAt(index);
    this.calcularTotales();
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
    const detalle = this.detalles.at(index);
    const cantidad = parseFloat(detalle.get('cantidad')?.value) || 0;
    const precioUnitario = parseFloat(detalle.get('precio_unitario')?.value) || 0;
    const subtotal = cantidad * precioUnitario;

    detalle.patchValue({ subtotal: subtotal });

    // Validar stock después del cálculo
    this.validarStock(index);
    this.calcularTotales();
  }

  // Calcular totales generales
  calcularTotales() {
    this.actualizarTotalesFormulario();
  }

  // Cuando cambia el descuento
  onDescuentoChange() {
    this.calcularTotales();
  }

  // Función para formatear la fecha correctamente para Prisma
  private formatDateForPrisma(dateString: string): string {
    if (!dateString) return new Date().toISOString();

    // Si ya tiene formato ISO con 'T', mantenerlo
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      return date.toISOString();
    }

    // Si es datetime-local (YYYY-MM-DDTHH:MM), convertirlo
    if (dateString.includes('-') && dateString.includes(':')) {
      const date = new Date(dateString);
      return date.toISOString();
    }

    // Formato por defecto
    const date = new Date(dateString);
    return date.toISOString();
  }

  submit() {
    // CORRECCIÓN: Solo validar si no hay detalles cuando tampoco hay datos cargados
    if (this.detallesLength() === 0 && !this.datosCargados()) {
      this._notificationService.showError('Debe haber al menos un producto en la venta');
      return;
    }

    // CORRECCIÓN: Si hay datos cargados pero se eliminaron todos los detalles, permitir guardar
    if (this.detallesLength() === 0 && this.datosCargados()) {
      // Permitir guardar incluso sin detalles si ya había datos cargados
      // Esto permite editar otros campos de la venta sin necesidad de productos
    }

    // Marcar todos los campos como touched para mostrar errores
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      // Verificar qué campos son inválidos
      if (this.form.get('id_cliente')?.invalid) {
        this._notificationService.showError('Seleccione un cliente');
      }
      if (this.form.get('fecha_venta')?.invalid) {
        this._notificationService.showError('La fecha de venta es requerida');
      }

      // Verificar detalles inválidos solo si hay detalles
      if (this.detallesLength() > 0) {
        let detallesInvalidos = false;
        this.detalles.controls.forEach((detalle, index) => {
          if (detalle.invalid) {
            detallesInvalidos = true;
          }
        });

        if (detallesInvalidos) {
          this._notificationService.showError('Verifique los productos agregados');
        }
      }

      return;
    }

    if (!this.usuarioActual()) {
      this._notificationService.showError(
        'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.'
      );
      return;
    }

    // Validar stock final antes de enviar solo si hay detalles
    if (this.detallesLength() > 0) {
      let stockValido = true;
      this.detalles.controls.forEach((detalle, index) => {
        if (!this.validarStock(index)) {
          stockValido = false;
        }
      });

      if (!stockValido) {
        this._notificationService.showError('Verifique las cantidades de los productos');
        return;
      }
    }

    this.isLoading.set(true);

    // Asegurar que los totales estén actualizados
    this.calcularTotales();

    // Preparar datos para enviar
    const formData = this.form.value;
    const fechaVentaFormateada = this.formatDateForPrisma(formData.fecha_venta);

    const data = {
      id_cliente: parseInt(formData.id_cliente),
      id_usuario: this.usuarioActual()!.id_usuario,
      fecha_venta: fechaVentaFormateada,
      subtotal: this.subtotalTotal(),
      descuento: parseFloat(formData.descuento) || 0,
      total: this.totalGeneral(),
      metodo_pago: formData.metodo_pago,
      estado: formData.estado,
      detalles:
        this.detallesLength() > 0
          ? formData.detalles.map((detalle: any) => ({
              id_producto: parseInt(detalle.id_producto),
              cantidad: parseFloat(detalle.cantidad),
              precio_unitario: parseFloat(detalle.precio_unitario),
              subtotal: parseFloat(detalle.subtotal),
            }))
          : [], // Enviar array vacío si no hay detalles
    };

    console.log('Enviando datos:', data);

    if (this.ventaId()) {
      // Actualizar venta existente
      this._ventaService.update(this.ventaId()!, data).subscribe({
        next: () => {
          this._notificationService.showSuccess('Venta actualizada exitosamente');
          this.isLoading.set(false);
          this._router.navigate(['/ventas']);
        },
        error: (error) => {
          console.error('Error updating venta:', error);
          this._notificationService.showError(
            'Error al actualizar la venta: ' +
              (error.error?.message || error.message || 'Error desconocido')
          );
          this.isLoading.set(false);
        },
      });
    }
  }

  cancel() {
    this._router.navigate(['/ventas']);
  }
}

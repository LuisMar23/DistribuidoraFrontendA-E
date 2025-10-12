import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  faShoppingCart,
  faArrowLeft,
  faSave,
  faPlus,
  faTrash,
  faSearch,
  faTimes,
  faMoneyBillWave,
  faCalendarDay,
  faClock,
  faSyncAlt,
  faCalendarCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NotificationService } from '../../../../core/services/notification.service';
import { VentaService } from '../../services/venta.service';


import { ProductService } from '../../../../core/services/product.service';

import { UserDto } from '../../../../core/interfaces/user.interface';
import { ProductDto } from '../../../../core/interfaces/product.interface';
import { AuthService } from '../../../../components/services/auth.service';
import { UserService } from '../../../users/services/users.service';
import { ClientService } from '../../../clientes/services/cliente.service';

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
  imports: [ReactiveFormsModule, FontAwesomeModule, CommonModule, FormsModule],
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
  faSearch = faSearch;
  faTimes = faTimes;
  faMoneyBillWave = faMoneyBillWave;
  faCalendarDay = faCalendarDay;
  faClock = faClock;
  faSyncAlt = faSyncAlt;
  faCalendarCheck = faCalendarCheck;

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

  // Signals para búsqueda
  mostrarBuscadorClientesModal = signal(false);
  mostrarBuscadorProductosModal = signal<number | null>(null);
  clienteSeleccionado = signal<ClienteOption | null>(null);
  clientesFiltrados = signal<ClienteOption[]>([]);
  productosFiltrados = signal<ProductoOption[]>([]);
  terminoBusquedaCliente = '';
  terminoBusquedaProducto = '';

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
      // Campos para plan de pago
      monto_inicial: [0],
      plazo: [''],
      periodicidad: ['DIAS'],
      fecha_inicio: [''],
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
          nombre: cliente.persona.nombre || 'Cliente sin nombre',
        }));
        this.clientes.set(clientesOptions);
        this.clientesFiltrados.set(clientesOptions);
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
        this.productosFiltrados.set(productosOptions);
      },
      error: (error) => {
        console.error('Error loading productos:', error);
        this._notificationService.showError('Error al cargar los productos');
      },
    });
  }

  // Métodos para el plan de pago
  onMetodoPagoChange() {
    const metodoPago = this.form.get('metodo_pago')?.value;
    if (metodoPago === 'credito') {
      // Establecer validadores para plan de pago
      this.form.get('plazo')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('fecha_inicio')?.setValidators([Validators.required]);
      this.form.get('periodicidad')?.setValidators([Validators.required]);

      // Establecer fecha de inicio como la misma fecha de la venta
      const fechaVenta = this.form.get('fecha_venta')?.value;
      if (fechaVenta) {
        const fechaVentaDate = new Date(fechaVenta);
        this.form.patchValue({
          fecha_inicio: fechaVentaDate.toISOString().split('T')[0],
        });
      }
    } else {
      // Remover validadores
      this.form.get('plazo')?.clearValidators();
      this.form.get('fecha_inicio')?.clearValidators();
      this.form.get('periodicidad')?.clearValidators();
    }
    this.form.get('plazo')?.updateValueAndValidity();
    this.form.get('fecha_inicio')?.updateValueAndValidity();
    this.form.get('periodicidad')?.updateValueAndValidity();
  }

  calcularFechaVencimiento(): string {
    const fechaInicio = this.form.get('fecha_inicio')?.value;
    const plazo = this.form.get('plazo')?.value;
    const periodicidad = this.form.get('periodicidad')?.value;

    if (!fechaInicio || !plazo) {
      return 'No calculada';
    }

    const fecha = new Date(fechaInicio);

    switch (periodicidad) {
      case 'DIAS':
        fecha.setDate(fecha.getDate() + parseInt(plazo));
        break;
      case 'SEMANAS':
        fecha.setDate(fecha.getDate() + parseInt(plazo) * 7);
        break;
      case 'MESES':
        fecha.setMonth(fecha.getMonth() + parseInt(plazo));
        break;
    }

    return fecha.toLocaleDateString('es-ES');
  }

  calcularTotalFinanciar(): number {
    const total = this.form.get('total')?.value || 0;
    const montoInicial = this.form.get('monto_inicial')?.value || 0;
    return Math.max(0, total - montoInicial);
  }

  calcularSaldoPendiente(): number {
    return this.calcularTotalFinanciar();
  }

  getPeriodicidadTexto(): string {
    const periodicidad = this.form.get('periodicidad')?.value;
    switch (periodicidad) {
      case 'DIAS':
        return 'días';
      case 'SEMANAS':
        return 'semanas';
      case 'MESES':
        return 'meses';
      default:
        return '';
    }
  }

  // Métodos para el buscador de clientes
  mostrarBuscadorClientes() {
    this.mostrarBuscadorClientesModal.set(true);
    this.terminoBusquedaCliente = '';
    this.filtrarClientes();
  }

  cerrarBuscadorClientes() {
    this.mostrarBuscadorClientesModal.set(false);
  }

  filtrarClientes() {
    const termino = this.terminoBusquedaCliente.toLowerCase().trim();
    if (!termino) {
      this.clientesFiltrados.set(this.clientes());
      return;
    }

    const filtrados = this.clientes().filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(termino) ||
        cliente.id_cliente.toString().includes(termino)
    );
    this.clientesFiltrados.set(filtrados);
  }

  seleccionarCliente(cliente: ClienteOption) {
    this.clienteSeleccionado.set(cliente);
    this.form.patchValue({
      id_cliente: cliente.id_cliente,
    });
    this.cerrarBuscadorClientes();
  }

  // Métodos para el buscador de productos
  mostrarBuscadorProductos(index: number) {
    this.mostrarBuscadorProductosModal.set(index);
    this.terminoBusquedaProducto = '';
    this.filtrarProductos();
  }

  cerrarBuscadorProductos() {
    this.mostrarBuscadorProductosModal.set(null);
  }

  filtrarProductos() {
    const termino = this.terminoBusquedaProducto.toLowerCase().trim();
    if (!termino) {
      this.productosFiltrados.set(this.productos());
      return;
    }

    const filtrados = this.productos().filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.categoria.toLowerCase().includes(termino) ||
        producto.id_producto.toString().includes(termino)
    );
    this.productosFiltrados.set(filtrados);
  }

  seleccionarProducto(producto: ProductoOption) {
    const index = this.mostrarBuscadorProductosModal();
    if (index !== null) {
      const detalle = this.detalles.at(index);
      detalle.patchValue({
        id_producto: producto.id_producto,
        precio_unitario: producto.precio_venta,
      });
      this.calcularSubtotalDetalle(index);
    }
    this.cerrarBuscadorProductos();
  }

  getProductoSeleccionadoNombre(index: number): string {
    const detalle = this.detalles.at(index);
    const idProducto = detalle.get('id_producto')?.value;

    if (idProducto) {
      const producto = this.productos().find((p) => p.id_producto === parseInt(idProducto));
      return producto ? producto.nombre : '';
    }
    return '';
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
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
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
      total: total,
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

    // Validar plan de pago si es crédito
    if (this.form.get('metodo_pago')?.value === 'credito') {
      if (!this.form.get('plazo')?.value || !this.form.get('fecha_inicio')?.value) {
        this._notificationService.showError(
          'Para ventas a crédito, complete todos los campos del plan de pago'
        );
        return;
      }
    }

    if (this.form.invalid || !detallesValidos) {
      this._notificationService.showError(
        'Por favor, complete todos los campos requeridos correctamente'
      );
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
    const fechaVentaFormateada =
      formData.fecha_venta.length === 16 ? formData.fecha_venta + ':00' : formData.fecha_venta;

    // Preparar datos de la venta
    const ventaData: any = {
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
        cantidad: parseFloat(detalle.cantidad),
        precioUnitario: parseFloat(detalle.precio_unitario),
      })),
    };

    // Agregar plan de pago si es crédito
    if (formData.metodo_pago === 'credito') {
      ventaData.plan_pago = {
        monto_inicial: parseFloat(formData.monto_inicial) || 0,
        plazo: parseInt(formData.plazo),
        periodicidad: formData.periodicidad,
        fecha_inicio: formData.fecha_inicio + 'T00:00:00', // Formato ISO
      };
    }

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

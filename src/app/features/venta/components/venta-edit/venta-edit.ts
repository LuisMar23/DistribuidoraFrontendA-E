import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  faReceipt,
  faExclamationTriangle,
  faUsers,
  faBoxes,
  faShoppingBasket,
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

// Interfaces locales
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

interface NuevoPago {
  monto: number;
  fecha_pago: string;
}

@Component({
  selector: 'app-venta-edit',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule, CommonModule, FormsModule],
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
  faSearch = faSearch;
  faTimes = faTimes;
  faMoneyBillWave = faMoneyBillWave;
  faReceipt = faReceipt;
  faExclamationTriangle = faExclamationTriangle;
  faUsers = faUsers;
  faBoxes = faBoxes;
  faShoppingBasket = faShoppingBasket;

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
  ventaId = signal<number>(0);
  planPagoOriginal = signal<any>(null);

  // Signals para búsqueda
  mostrarBuscadorClientesModal = signal(false);
  mostrarBuscadorProductosModal = signal<number | null>(null);
  clienteSeleccionado = signal<ClienteOption | null>(null);
  clientesFiltrados = signal<ClienteOption[]>([]);
  productosFiltrados = signal<ProductoOption[]>([]);
  terminoBusquedaCliente = '';
  terminoBusquedaProducto = '';

  // Datos para nuevo pago
  nuevoPago: NuevoPago = {
    monto: 0,
    fecha_pago: '',
  };

  // Form
  form: FormGroup;

  // Computed values
  detallesLength = computed(() => this.detalles.length);
  tienePlanPagoConPagos = computed(() => {
    const planPago = this.planPagoOriginal();
    return planPago && planPago.pagos && planPago.pagos.length > 0;
  });

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
  }

  ngOnInit() {
    this.loadUsuarioActual();

    // Obtener ID de la ruta
    const id = this._route.snapshot.paramMap.get('id');
    console.log('ID obtenido de la ruta:', id);

    if (id && !isNaN(parseInt(id))) {
      const ventaId = parseInt(id);
      this.ventaId.set(ventaId);
      console.log('ID de venta configurado:', this.ventaId());

      // Cargar datos en secuencia
      this.loadDatosIniciales()
        .then(() => {
          this.loadVenta();
        })
        .catch((error) => {
          console.error('Error cargando datos iniciales:', error);
          this._notificationService.showError('Error al cargar los datos iniciales');
        });
    } else {
      console.error('ID de venta no válido:', id);
      this._notificationService.showError('ID de venta no válido');
      this._router.navigate(['/ventas']);
    }
  }

  private async loadDatosIniciales(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Cargando datos iniciales...');

      // Cargar clientes primero
      this._clienteService.getAll().subscribe({
        next: (clientes: ClientDto[]) => {
          console.log('Clientes cargados:', clientes.length);
          const clientesOptions: ClienteOption[] = clientes.map((cliente) => ({
            id_cliente: cliente.id_cliente || 0,
            nombre: cliente.persona.nombre || 'Cliente sin nombre',
          }));
          this.clientes.set(clientesOptions);
          this.clientesFiltrados.set(clientesOptions);

          // Luego cargar productos
          this._productoService.getAll().subscribe({
            next: (productos: ProductDto[]) => {
              console.log('Productos cargados:', productos.length);
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
              console.log('Todos los datos iniciales cargados');
              resolve();
            },
            error: (error) => {
              console.error('Error loading productos:', error);
              reject(error);
            },
          });
        },
        error: (error) => {
          console.error('Error loading clientes:', error);
          reject(error);
        },
      });
    });
  }

  private loadVenta() {
    console.log('Cargando venta con ID:', this.ventaId());
    this.isLoading.set(true);

    this._ventaService.getById(this.ventaId()).subscribe({
      next: (venta: any) => {
        console.log('Venta cargada exitosamente:', venta);

        // Verificar que la venta tiene los datos necesarios
        if (!venta) {
          throw new Error('La venta no contiene datos');
        }

        // Cargar datos del plan de pago si existe - manejar diferentes nombres posibles
        const planPago = venta.PlanPago || venta.planPago || venta.plan_pago;
        if (planPago) {
          console.log('Plan de pago encontrado:', planPago);
          this.planPagoOriginal.set(planPago);
        }

        this.patchFormWithVentaData(venta);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando venta:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error,
        });

        let errorMessage = 'Error al cargar la venta';

        if (error.status === 404) {
          errorMessage = `No se encontró la venta con ID ${this.ventaId()}. Verifica que la venta exista en el sistema.`;
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor al cargar la venta';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this._notificationService.showError(errorMessage);
        this.isLoading.set(false);

        // Redirigir después de mostrar el error
        setTimeout(() => {
          this._router.navigate(['/ventas']);
        }, 3000);
      },
    });
  }

  // Métodos para calcular totales del plan de pago
  calcularTotalPagado(): number {
    const planPago = this.planPagoOriginal();
    if (!planPago || !planPago.pagos) return 0;

    return planPago.pagos.reduce((total: number, pago: any) => total + Number(pago.monto), 0);
  }

  calcularSaldoPendiente(): number {
    const planPago = this.planPagoOriginal();
    if (!planPago) return 0;

    const total = Number(planPago.total);
    const pagado = this.calcularTotalPagado();
    return Math.max(0, total - pagado);
  }

  // Método para verificar y actualizar estado automáticamente
  private verificarYActualizarEstado() {
    const saldoPendiente = this.calcularSaldoPendiente();

    if (saldoPendiente <= 0 && this.form.get('metodo_pago')?.value === 'credito') {
      // Si el saldo pendiente es cero o menor y es una venta a crédito, cambiar estado a "pagado"
      this.form.patchValue({ estado: 'pagado' });
      console.log(
        'Estado actualizado automáticamente a "pagado" porque el saldo pendiente es:',
        saldoPendiente
      );
    } else if (saldoPendiente > 0 && this.form.get('metodo_pago')?.value === 'credito') {
      // Si hay saldo pendiente y es una venta a crédito, mantener estado como "pendiente"
      this.form.patchValue({ estado: 'pendiente' });
    }
  }

  // Método para agregar nuevo pago
  agregarPago() {
    if (!this.nuevoPago.monto || !this.nuevoPago.fecha_pago) {
      this._notificationService.showError('Complete el monto y la fecha del pago');
      return;
    }

    if (this.nuevoPago.monto > this.calcularSaldoPendiente()) {
      this._notificationService.showError(
        'El monto del pago no puede ser mayor al saldo pendiente'
      );
      return;
    }

    this.isLoading.set(true);

    // Preparar datos para el pago usando la estructura correcta del DTO
    const pagoData = {
      plan_pago_id: this.planPagoOriginal().id_plan_pago,
      monto: this.nuevoPago.monto,
      fecha_pago: this.nuevoPago.fecha_pago,
      observacion: 'Pago adicional registrado desde edición',
    };

    console.log('Enviando pago al backend:', pagoData);

    // Usar el endpoint correcto para registrar pagos
    this._ventaService.registrarPagoPlanPago(pagoData).subscribe({
      next: (response: any) => {
        console.log('Pago registrado exitosamente:', response);

        // Recargar la venta completa para obtener los datos actualizados
        this.loadVenta();

        // Limpiar formulario
        this.nuevoPago = {
          monto: 0,
          fecha_pago: '',
        };

        this._notificationService.showSuccess('Pago registrado exitosamente');
        this.isLoading.set(false);

        // Verificar y actualizar estado después de agregar pago
        this.verificarYActualizarEstado();
      },
      error: (error) => {
        console.error('Error registrando pago:', error);
        let errorMessage = 'Error al registrar el pago';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this._notificationService.showError(errorMessage);
        this.isLoading.set(false);
      },
    });
  }

  // Método para eliminar pago
  eliminarPago(pagoId: number) {
    if (!confirm('¿Está seguro de que desea eliminar este pago?')) {
      return;
    }

    this.isLoading.set(true);

    // Usar el endpoint específico para eliminar pagos
    this._ventaService.eliminarPagoPlanPago(pagoId).subscribe({
      next: (response: any) => {
        console.log('Pago eliminado exitosamente:', response);

        // Recargar la venta completa para obtener los datos actualizados
        this.loadVenta();

        this._notificationService.showSuccess('Pago eliminado exitosamente');
        this.isLoading.set(false);

        // Verificar y actualizar estado después de eliminar pago
        this.verificarYActualizarEstado();
      },
      error: (error) => {
        console.error('Error eliminando pago:', error);
        let errorMessage = 'Error al eliminar el pago';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this._notificationService.showError(errorMessage);
        this.isLoading.set(false);
      },
    });
  }

  private prepararDatosVenta(): any {
    const formData = this.form.value;

    // Formatear fecha correctamente
    let fechaVentaFormateada: string;
    if (formData.fecha_venta) {
      // Convertir de datetime-local a formato ISO
      const fecha = new Date(formData.fecha_venta);
      fechaVentaFormateada = fecha.toISOString();
    } else {
      fechaVentaFormateada = new Date().toISOString();
    }

    // PREPARAR DATOS PARA ENVIAR AL BACKEND
    const ventaData: any = {
      id_cliente: parseInt(formData.id_cliente),
      fecha_venta: fechaVentaFormateada,
      metodo_pago: formData.metodo_pago,
      estado: formData.estado,
      descuento: parseFloat(formData.descuento) || 0,
    };

    // Solo incluir detalles si no hay pagos registrados
    if (!this.tienePlanPagoConPagos()) {
      ventaData.detalles = formData.detalles.map((detalle: any) => ({
        productoId: parseInt(detalle.productoId),
        cantidad: parseFloat(detalle.cantidad),
        precioUnitario: parseFloat(detalle.precioUnitario),
      }));
    } else {
      // Si hay pagos registrados, no enviar detalles ni descuento
      delete ventaData.descuento;
    }

    return ventaData;
  }

  private patchFormWithVentaData(venta: any) {
    console.log('Patch form con datos de venta:', venta);

    if (!venta) {
      console.error('No hay datos de venta para hacer patch');
      return;
    }

    try {
      // Formatear fecha
      let formattedDate = '';
      if (venta.fecha_venta) {
        const fechaVenta = new Date(venta.fecha_venta);
        formattedDate = fechaVenta.toISOString().slice(0, 16);
        console.log('Fecha formateada:', formattedDate);
      }

      // Limpiar detalles existentes
      while (this.detalles.length !== 0) {
        this.detalles.removeAt(0);
      }

      // Cargar detalles de la venta
      if (venta.detalles && venta.detalles.length > 0) {
        console.log('Cargando detalles:', venta.detalles.length);
        venta.detalles.forEach((detalle: any, index: number) => {
          console.log(`Detalle ${index}:`, detalle);
          this.agregarDetalleExistente(detalle);
        });
      } else {
        console.log('No hay detalles en la venta');
      }

      // Obtener ID del cliente
      const clienteId = venta.id_cliente || venta.clienteId;
      console.log('ID del cliente:', clienteId);

      // Configurar cliente seleccionado
      if (clienteId) {
        const cliente = this.clientes().find((c) => c.id_cliente === clienteId);
        if (cliente) {
          console.log('Cliente encontrado:', cliente);
          this.clienteSeleccionado.set(cliente);
        } else {
          console.warn('Cliente no encontrado con ID:', clienteId);
        }
      }

      // Actualizar formulario
      this.form.patchValue({
        id_cliente: clienteId || '',
        id_usuario: venta.id_usuario || venta.usuarioId || this.usuarioActual()?.id_usuario,
        fecha_venta: formattedDate,
        subtotal: venta.subtotal || 0,
        descuento: venta.descuento || 0,
        total: venta.total || 0,
        metodo_pago: venta.metodo_pago || venta.metodoPago || 'efectivo',
        estado: venta.estado || 'pendiente',
      });

      console.log('Form después del patch:', this.form.value);
      this.actualizarTotales();

      // Verificar y actualizar estado después de cargar la venta
      this.verificarYActualizarEstado();
    } catch (error) {
      console.error('Error en patchFormWithVentaData:', error);
      this._notificationService.showError('Error al cargar los datos de la venta');
    }
  }

  private agregarDetalleExistente(detalleData: any) {
    try {
      console.log('Agregando detalle existente:', detalleData);

      const productoId = detalleData.productoId || detalleData.id_producto;
      const cantidad = detalleData.cantidad || 1;
      const precioUnitario = detalleData.precioUnitario || detalleData.precio_unitario || 0;
      const subtotal = detalleData.subtotal || cantidad * precioUnitario;

      console.log(
        `Detalle - ProductoID: ${productoId}, Cantidad: ${cantidad}, Precio: ${precioUnitario}, Subtotal: ${subtotal}`
      );

      const detalleForm = this._fb.group({
        productoId: [productoId ? productoId.toString() : '', Validators.required],
        cantidad: [cantidad, [Validators.required, Validators.min(0.01)]],
        precioUnitario: [precioUnitario, [Validators.required, Validators.min(0)]],
        subtotal: [subtotal, [Validators.required, Validators.min(0)]],
      });

      this.detalles.push(detalleForm);
      console.log('Detalle agregado exitosamente');
    } catch (error) {
      console.error('Error agregando detalle:', error);
    }
  }

  private loadUsuarioActual() {
    const usuario = this._authService.getCurrentUser();
    console.log('Usuario actual:', usuario);

    if (usuario) {
      const usuarioOption: UsuarioOption = {
        id_usuario: usuario.id || usuario.id_usuario || usuario.userId || 1,
        nombre: usuario.nombre || usuario.fullName || usuario.username || 'Usuario actual',
      };

      this.usuarioActual.set(usuarioOption);
      this.form.patchValue({
        id_usuario: usuarioOption.id_usuario,
      });
      console.log('Usuario configurado:', usuarioOption);
    } else {
      console.warn('No se encontró usuario autenticado');
      this._notificationService.showError(
        'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.'
      );
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
    console.log('Cliente seleccionado:', cliente);
    this.clienteSeleccionado.set(cliente);
    this.form.patchValue({
      id_cliente: cliente.id_cliente,
    });
    this.cerrarBuscadorClientes();
  }

  // Métodos para el buscador de productos
  mostrarBuscadorProductos(index: number) {
    // No permitir buscar productos si hay pagos registrados
    if (this.tienePlanPagoConPagos()) {
      this._notificationService.showWarning(
        'No se pueden modificar los productos porque ya hay pagos registrados en el plan de pago'
      );
      return;
    }
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
      console.log(`Producto seleccionado para detalle ${index}:`, producto);
      const detalle = this.detalles.at(index);
      detalle.patchValue({
        productoId: producto.id_producto,
        precioUnitario: producto.precio_venta,
      });
      this.calcularSubtotalDetalle(index);
    }
    this.cerrarBuscadorProductos();
  }

  getProductoSeleccionadoNombre(index: number): string {
    const detalle = this.detalles.at(index);
    const productoId = detalle.get('productoId')?.value;

    if (productoId) {
      const producto = this.productos().find((p) => p.id_producto === parseInt(productoId));
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
      const precioUnitario = Number(detalle.get('precioUnitario')?.value) || 0;
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
    // No permitir agregar detalles si hay pagos registrados
    if (this.tienePlanPagoConPagos()) {
      this._notificationService.showWarning(
        'No se pueden agregar productos porque ya hay pagos registrados en el plan de pago'
      );
      return;
    }

    const detalleForm = this._fb.group({
      productoId: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [0, [Validators.required, Validators.min(0)]],
    });

    this.detalles.push(detalleForm);
  }

  // Eliminar detalle
  eliminarDetalle(index: number) {
    // No permitir eliminar detalles si hay pagos registrados
    if (this.tienePlanPagoConPagos()) {
      this._notificationService.showWarning(
        'No se pueden eliminar productos porque ya hay pagos registrados en el plan de pago'
      );
      return;
    }

    this.detalles.removeAt(index);
    this.actualizarTotales();
  }

  // Validar stock disponible
  validarStock(index: number): boolean {
    const detalle = this.detalles.at(index);
    const productoId = detalle.get('productoId')?.value;
    const cantidad = detalle.get('cantidad')?.value || 0;

    if (productoId) {
      const producto = this.productos().find((p) => p.id_producto === parseInt(productoId));
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
    const precioUnitario = Number(detalle.get('precioUnitario')?.value) || 0;
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

  submit() {
    this.form.markAllAsTouched();
    this.actualizarTotales();

    let detallesValidos = true;
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      detalle.markAllAsTouched();

      if (detalle.invalid) {
        detallesValidos = false;
        const productoId = detalle.get('productoId')?.value;
        if (!productoId) {
          this._notificationService.showError(`Seleccione un producto para la línea ${i + 1}`);
          return;
        }
      }
    }

    if (this.form.invalid || !detallesValidos) {
      this._notificationService.showError('Complete todos los campos requeridos');
      return;
    }

    if (this.detalles.length === 0) {
      this._notificationService.showError('Agregue al menos un producto');
      return;
    }

    if (!this.usuarioActual()) {
      this._notificationService.showError('No se pudo identificar al usuario');
      return;
    }

    for (let i = 0; i < this.detalles.length; i++) {
      if (!this.validarStock(i)) {
        return;
      }
    }

    this.isLoading.set(true);

    const ventaData = this.prepararDatosVenta();

    console.log('Enviando datos al backend:', {
      ventaId: this.ventaId(),
      datos: ventaData,
      tienePagosRegistrados: this.tienePlanPagoConPagos(),
    });

    this._ventaService.update(this.ventaId(), ventaData).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this._notificationService.showSuccess('Venta actualizada exitosamente');
        this.isLoading.set(false);
        this._router.navigate(['/ventas']);
      },
      error: (error) => {
        console.error('Error del servidor:', error);

        let errorMessage = 'Error al actualizar la venta';

        if (error.status === 404) {
          errorMessage = `No se encontró la venta con ID ${this.ventaId()}. Verifica que la venta exista.`;
        } else if (error.status === 409) {
          errorMessage =
            'No se puede editar los detalles o descuento de una venta con plan de pago que ya tiene pagos registrados.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
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

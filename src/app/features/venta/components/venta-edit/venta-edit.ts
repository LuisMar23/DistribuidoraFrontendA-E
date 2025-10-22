import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
  faStickyNote,
  faEdit,
  faUser,
  faBox,
  faWeightHanging,
  faReceipt,
  faCreditCard,
  faDollarSign,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NotificationService } from '../../../../core/services/notification.service';
import { VentaService } from '../../services/venta.service';
import { AuthService } from '../../../../components/services/auth.service';
import { ClientService } from '../../../clientes/services/cliente.service';
import { ProductService } from '../../../products/services/product.service';

// Interfaces locales
interface ClienteOption {
  id_cliente: number;
  personaId: number;
  nombre: string;
  apellido?: string;
  nombreCompleto: string;
  nit_ci: string;
  telefono: string;
}

interface UsuarioOption {
  id: number;
  fullName: string;
}

interface ProductoOption {
  id_producto: number;
  codigo: string;
  peso: number;
  estado: boolean;
  peso_disponible: number;
  nombre?: string;
}

interface PagoPlan {
  id_pago_plan?: number;
  uuid?: string;
  plan_pago_id: number;
  monto: number;
  fecha_pago: string;
  observacion?: string;
  es_monto_inicial?: boolean;
}

@Component({
  selector: 'app-venta-edit',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './venta-edit.html',
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
  faCalendarDay = faCalendarDay;
  faClock = faClock;
  faSyncAlt = faSyncAlt;
  faCalendarCheck = faCalendarCheck;
  faStickyNote = faStickyNote;
  faEdit = faEdit;
  faUser = faUser;
  faBox = faBox;
  faWeightHanging = faWeightHanging;
  faReceipt = faReceipt;
  faCreditCard = faCreditCard;
  faDollarSign = faDollarSign;
  faCalendarAlt = faCalendarAlt;

  // Services
  private _notificationService = inject(NotificationService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _clienteService = inject(ClientService);
  private _productoService = inject(ProductService);
  private _authService = inject(AuthService);
  private _ventaService = inject(VentaService);
  private _fb = inject(FormBuilder);

  // Signals
  isLoading = signal(false);
  loadingVenta = signal(true);
  clientes = signal<ClienteOption[]>([]);
  usuarioActual = signal<UsuarioOption | null>(null);
  productos = signal<ProductoOption[]>([]);
  ventaId = signal<number>(0);
  ventaOriginal = signal<any>(null);
  planPagoId = signal<number | null>(null);
  pagosExistentes = signal<PagoPlan[]>([]);
  montoInicial = signal<number>(0);
  fechaInicio = signal<string>('');

  // Signals para búsqueda
  mostrarBuscadorClientesModal = signal(false);
  mostrarBuscadorProductosModal = signal<number | null>(null);
  clienteSeleccionado = signal<ClienteOption | null>(null);
  clientesFiltrados = signal<ClienteOption[]>([]);
  productosFiltrados = signal<ProductoOption[]>([]);
  terminoBusquedaCliente = '';
  terminoBusquedaProducto = '';

  // Signals para pagos adicionales
  mostrarModalPago = signal(false);
  formPago: FormGroup;

  // Form principal
  form: FormGroup;

  constructor() {
    // Formulario principal
    this.form = this._fb.group({
      id_cliente: ['', Validators.required],
      fecha_venta: ['', Validators.required],
      subtotal: [0],
      descuento: [0],
      total: [0],
      metodo_pago: ['efectivo', Validators.required],
      estado: ['pendiente', Validators.required],
      observaciones: [''],
      // Campos para plan de pago (SOLO para crédito) - NO editables
      plazo: [1],
      periodicidad: ['DIAS'],
      detalles: this._fb.array([]),
    });

    // Formulario para pagos adicionales
    this.formPago = this._fb.group({
      monto: [0, [Validators.required, Validators.min(0.01)]],
      fecha_pago: ['', Validators.required],
      observacion: [''],
    });
  }

  ngOnInit() {
    this.loadUsuarioActual();
    this.loadDatos();
    this.loadVenta();
    this.setCurrentDateTimePago();
  }

  private loadVenta() {
    const id = Number(this._route.snapshot.paramMap.get('id'));
    if (!id) {
      this._notificationService.showError('ID de venta no válido');
      this._router.navigate(['/ventas']);
      return;
    }

    this.ventaId.set(id);

    this._ventaService.getById(id).subscribe({
      next: (venta) => {
        this.ventaOriginal.set(venta);
        this.patchFormWithVentaData(venta);
        this.loadingVenta.set(false);
      },
      error: (error) => {
        console.error('Error loading venta:', error);
        this._notificationService.showError('Error al cargar la venta');
        this.loadingVenta.set(false);
        this._router.navigate(['/ventas']);
      },
    });
  }

  private patchFormWithVentaData(venta: any) {
    // Formatear fecha
    const fechaVenta = venta.fecha_venta
      ? new Date(venta.fecha_venta).toISOString().slice(0, 16)
      : '';

    // Configurar cliente seleccionado
    if (venta.cliente) {
      const clienteOption: ClienteOption = {
        id_cliente: venta.id_cliente,
        personaId: venta.cliente.persona?.id || 0,
        nombre: venta.cliente.persona?.nombre || 'Cliente sin nombre',
        apellido: venta.cliente.persona?.apellido || '',
        nombreCompleto: this.getClienteNombreCompleto(venta.cliente),
        nit_ci: venta.cliente.persona?.nit_ci || '',
        telefono: venta.cliente.persona?.telefono || '',
      };
      this.clienteSeleccionado.set(clienteOption);
    }

    // Patch valores básicos del formulario
    this.form.patchValue({
      id_cliente: venta.id_cliente,
      fecha_venta: fechaVenta,
      subtotal: this.formatNumber(venta.subtotal || 0),
      descuento: this.formatNumber(venta.descuento || 0),
      total: this.formatNumber(venta.total || 0),
      metodo_pago: venta.metodo_pago || 'efectivo',
      estado: venta.estado || 'pendiente',
      observaciones: venta.observaciones || '',
    });

    // Cargar detalles
    this.cargarDetalles(venta.detalles || []);

    // Cargar plan de pago si existe
    this.cargarPlanPago(venta);

    this.actualizarTotales();
  }

  private getClienteNombreCompleto(cliente: any): string {
    const persona = cliente.persona || {};
    const nombreCompleto = persona.nombre
      ? `${persona.nombre} ${persona.apellido || ''}`.trim()
      : 'Cliente sin nombre';
    return nombreCompleto;
  }

  private cargarDetalles(detalles: any[]) {
    // Limpiar array existente
    while (this.detalles.length !== 0) {
      this.detalles.removeAt(0);
    }

    // Agregar detalles
    detalles.forEach((detalle) => {
      this.agregarDetalleConDatos(detalle);
    });
  }

  private cargarPlanPago(venta: any) {
    const planPago = venta.planPago;
    if (planPago) {
      this.planPagoId.set(planPago.id_plan_pago);

      // Guardar monto inicial y fecha de inicio (NO editables)
      this.montoInicial.set(this.formatNumber(planPago.monto_inicial || 0));

      const fechaInicio = planPago.fecha_inicio
        ? new Date(planPago.fecha_inicio).toISOString().split('T')[0]
        : '';
      this.fechaInicio.set(fechaInicio);

      // Cargar TODOS los pagos (incluyendo monto inicial como pago)
      const todosLosPagos = planPago.pagos || [];
      this.pagosExistentes.set(todosLosPagos);

      this.form.patchValue({
        plazo: planPago.plazo || 1,
        periodicidad: planPago.periodicidad || 'DIAS',
      });
    }
  }

  private agregarDetalleConDatos(detalle: any) {
    const detalleForm = this._fb.group({
      productoId: [detalle.productoId || ''],
      producto_codigo: [detalle.producto_codigo || '', Validators.required],
      nombre_producto: [detalle.nombre_producto || '', Validators.required],
      precio_por_kilo: [
        this.formatNumber(detalle.precio_por_kilo || 0),
        [Validators.required, Validators.min(0)],
      ],
      precio_unitario: [
        this.formatNumber(detalle.precio_unitario || detalle.precio_por_kilo || 0),
        [Validators.required, Validators.min(0)],
      ],
      peso_original: [
        this.formatNumber(detalle.peso_original || 0),
        [Validators.required, Validators.min(0.01)],
      ],
      descuento_peso: [
        this.formatNumber(detalle.descuento_peso || 0),
        [Validators.required, Validators.min(0)],
      ],
      peso_final: [this.formatNumber(detalle.peso_final || 0)],
      subtotal: [this.formatNumber(detalle.subtotal || 0)],
    });

    this.detalles.push(detalleForm);
  }

  private formatNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);

    if (isNaN(numValue)) {
      console.warn('Valor no numérico encontrado:', value);
      return 0;
    }

    return Number(numValue.toFixed(2));
  }

  private loadUsuarioActual() {
    try {
      let usuario: any = null;

      if (this._authService && typeof this._authService.getCurrentUser === 'function') {
        usuario = this._authService.getCurrentUser();
      }

      if (!usuario) {
        const possibleKeys = ['currentUser', 'user', 'usuario', 'auth-user', 'userData'];
        for (const key of possibleKeys) {
          const storedUser = localStorage.getItem(key);
          if (storedUser) {
            try {
              usuario = JSON.parse(storedUser);
              break;
            } catch (e) {
              console.warn(`Error parseando usuario de ${key}:`, e);
            }
          }
        }
      }

      if (usuario) {
        const usuarioOption: UsuarioOption = {
          id: usuario.id || 1,
          fullName: usuario.fullName || usuario.nombre || 'Usuario Sistema',
        };
        this.usuarioActual.set(usuarioOption);
      } else {
        const usuarioDefault: UsuarioOption = {
          id: 1,
          fullName: 'Usuario Sistema (Desarrollo)',
        };
        this.usuarioActual.set(usuarioDefault);
      }
    } catch (error) {
      console.error('Error en loadUsuarioActual:', error);
      const usuarioDefault: UsuarioOption = {
        id: 1,
        fullName: 'Usuario Sistema',
      };
      this.usuarioActual.set(usuarioDefault);
    }
  }

  private loadDatos() {
    // Cargar clientes
    this._clienteService.getAll().subscribe({
      next: (clientes: any[]) => {
        const clientesOptions: ClienteOption[] = clientes.map((cliente) => {
          const persona = cliente.persona || {};
          const nombreCompleto = persona.nombre
            ? `${persona.nombre} ${persona.apellido || ''}`.trim()
            : 'Cliente sin nombre';

          return {
            id_cliente: cliente.id_cliente || 0,
            personaId: persona.id || 0,
            nombre: persona.nombre || 'Cliente sin nombre',
            apellido: persona.apellido || '',
            nombreCompleto: nombreCompleto,
            nit_ci: persona.nit_ci || '',
            telefono: persona.telefono || '',
          };
        });
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
      next: (productos: any[]) => {
        const productosOptions: ProductoOption[] = productos
          .filter((producto) => producto.estado)
          .map((producto) => ({
            id_producto: producto.id_producto || 0,
            codigo: producto.codigo || '',
            peso: producto.peso || 0,
            estado: producto.estado || false,
            peso_disponible: producto.peso || 0,
            nombre: producto.nombre || `Producto ${producto.codigo}`,
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

  // MÉTODOS PARA PAGOS ADICIONALES
  mostrarAgregarPago() {
    this.mostrarModalPago.set(true);
    this.setCurrentDateTimePago();

    // Calcular saldo pendiente para el monto máximo
    const saldoPendiente = this.calcularSaldoPendiente();
    this.formPago.patchValue({
      monto: saldoPendiente > 0 ? this.formatNumber(saldoPendiente) : 0,
    });
  }

  cerrarModalPago() {
    this.mostrarModalPago.set(false);
    this.formPago.reset();
    this.setCurrentDateTimePago();
  }

  private setCurrentDateTimePago() {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    this.formPago.patchValue({
      fecha_pago: formattedDate,
    });
  }

  registrarPagoAdicional() {
    if (this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      this._notificationService.showError('Complete todos los campos del pago');
      return;
    }

    const planPagoId = this.planPagoId();
    if (!planPagoId) {
      this._notificationService.showError('No se encontró el plan de pago');
      return;
    }

    const pagoData = {
      plan_pago_id: planPagoId,
      monto: this.formatNumber(this.formPago.value.monto),
      fecha_pago: this.formPago.value.fecha_pago,
      observacion: this.formPago.value.observacion || 'Pago adicional',
    };

    this.isLoading.set(true);

    this._ventaService.registrarPagoPlan(pagoData).subscribe({
      next: (response) => {
        this._notificationService.showSuccess('Pago registrado exitosamente');
        this.cerrarModalPago();
        this.isLoading.set(false);
        // Recargar la venta para actualizar los datos
        this.loadVenta();
      },
      error: (error) => {
        console.error('Error registrando pago:', error);
        let errorMessage = 'Error al registrar el pago';

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

  // CORRECCIÓN: Métodos para el plan de pago
  calcularFechaVencimiento(): string {
    const fechaInicio = this.fechaInicio();
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

  // CORRECCIÓN: Cálculo del total pagado (incluye monto inicial + pagos adicionales)
  calcularTotalPagado(): number {
    return this.pagosExistentes().reduce((total, pago) => total + Number(pago.monto), 0);
  }

  // CORRECCIÓN: Cálculo del saldo pendiente
  calcularSaldoPendiente(): number {
    const total = this.form.get('total')?.value || 0;
    const totalPagado = this.calcularTotalPagado();
    return this.formatNumber(Math.max(0, total - totalPagado));
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
        cliente.nombreCompleto.toLowerCase().includes(termino) ||
        cliente.nombre.toLowerCase().includes(termino) ||
        cliente.nit_ci.includes(termino) ||
        cliente.telefono.includes(termino) ||
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
        producto.codigo.toLowerCase().includes(termino) ||
        producto.id_producto.toString().includes(termino) ||
        (producto.nombre && producto.nombre.toLowerCase().includes(termino))
    );
    this.productosFiltrados.set(filtrados);
  }

  seleccionarProducto(producto: ProductoOption) {
    const index = this.mostrarBuscadorProductosModal();
    if (index !== null) {
      const detalle = this.detalles.at(index);
      detalle.patchValue({
        productoId: producto.id_producto,
        producto_codigo: producto.codigo,
        nombre_producto: producto.nombre || `Producto ${producto.codigo}`,
        precio_por_kilo: 0,
        precio_unitario: 0,
      });

      this.validarPeso(index);
    }
    this.cerrarBuscadorProductos();
  }

  getProductoSeleccionadoCodigo(index: number): string {
    const detalle = this.detalles.at(index);
    const idProducto = detalle.get('productoId')?.value;

    if (idProducto) {
      const producto = this.productos().find((p) => p.id_producto === parseInt(idProducto));
      return producto ? producto.codigo : '';
    }
    return '';
  }

  getPesoDisponibleProducto(index: number): number {
    const detalle = this.detalles.at(index);
    const idProducto = detalle.get('productoId')?.value;

    if (idProducto) {
      const producto = this.productos().find((p) => p.id_producto === parseInt(idProducto));
      return producto ? this.formatNumber(producto.peso_disponible) : 0;
    }
    return 0;
  }

  // Getter para el FormArray de detalles
  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  // Calcular subtotal de un detalle
  calcularSubtotalDetalle(index: number) {
    if (index < 0 || index >= this.detalles.length) return;

    const detalle = this.detalles.at(index);
    const precioPorKilo = Number(detalle.get('precio_por_kilo')?.value) || 0;
    const precioUnitario = Number(detalle.get('precio_unitario')?.value) || 0;
    const pesoOriginal = Number(detalle.get('peso_original')?.value) || 0;
    const descuentoPeso = Number(detalle.get('descuento_peso')?.value) || 0;

    const pesoFinal = Math.max(0, pesoOriginal - descuentoPeso);
    const subtotal = precioPorKilo * pesoFinal;

    // Actualizar también precio_unitario si es diferente
    if (precioPorKilo !== precioUnitario) {
      detalle.patchValue({
        precio_unitario: this.formatNumber(precioPorKilo),
      });
    }

    detalle.patchValue(
      {
        peso_final: this.formatNumber(pesoFinal),
        subtotal: this.formatNumber(subtotal),
      },
      { emitEvent: false }
    );

    this.actualizarTotales();
  }

  // Calcular descuento en dinero
  calcularDescuentoEnDinero(): number {
    let descuentoTotal = 0;
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      const precioPorKilo = Number(detalle.get('precio_por_kilo')?.value) || 0;
      const descuentoPeso = Number(detalle.get('descuento_peso')?.value) || 0;
      descuentoTotal += precioPorKilo * descuentoPeso;
    }
    return this.formatNumber(descuentoTotal);
  }

  // Calcular subtotal total de todos los productos
  calcularSubtotalTotal(): number {
    let total = 0;
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      const subtotal = Number(detalle.get('subtotal')?.value) || 0;
      total += subtotal;
    }
    return this.formatNumber(total);
  }

  // Calcular total general
  calcularTotalGeneral(): number {
    const subtotal = this.calcularSubtotalTotal();
    const descuento = this.calcularDescuentoEnDinero();
    return this.formatNumber(Math.max(0, subtotal - descuento));
  }

  // Agregar detalle
  agregarDetalle() {
    const detalleForm = this._fb.group({
      productoId: [''],
      producto_codigo: ['', Validators.required],
      nombre_producto: ['', Validators.required],
      precio_por_kilo: [0, [Validators.required, Validators.min(0)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      peso_original: [0, [Validators.required, Validators.min(0.01)]],
      descuento_peso: [0, [Validators.required, Validators.min(0)]],
      peso_final: [0],
      subtotal: [0],
    });

    this.detalles.push(detalleForm);
  }

  // Eliminar detalle
  eliminarDetalle(index: number) {
    this.detalles.removeAt(index);
    this.actualizarTotales();
  }

  // Validar peso disponible
  validarPeso(index: number): boolean {
    const detalle = this.detalles.at(index);
    const idProducto = detalle.get('productoId')?.value;
    const pesoOriginal = detalle.get('peso_original')?.value || 0;

    if (idProducto) {
      const producto = this.productos().find((p) => p.id_producto === parseInt(idProducto));
      if (producto && pesoOriginal > producto.peso_disponible) {
        this._notificationService.showError(
          `Stock insuficiente. Solo hay ${this.formatNumber(
            producto.peso_disponible
          )} kg disponibles.`
        );
        detalle.patchValue({ peso_original: this.formatNumber(producto.peso_disponible) });
        this.calcularSubtotalDetalle(index);
        return false;
      }
    }
    return true;
  }

  // Actualizar totales
  actualizarTotales() {
    const subtotal = this.calcularSubtotalTotal();
    const descuento = this.calcularDescuentoEnDinero();
    const total = this.calcularTotalGeneral();

    this.form.patchValue({
      subtotal: this.formatNumber(subtotal),
      descuento: this.formatNumber(descuento),
      total: this.formatNumber(total),
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
        const producto_codigo = detalle.get('producto_codigo')?.value;
        const nombre_producto = detalle.get('nombre_producto')?.value;
        if (!producto_codigo || !nombre_producto) {
          this._notificationService.showError(`Complete todos los campos para la línea ${i + 1}`);
          return;
        }
      }

      // Validar que el descuento no sea mayor al peso original
      const pesoOriginal = detalle.get('peso_original')?.value || 0;
      const descuentoPeso = detalle.get('descuento_peso')?.value || 0;
      if (descuentoPeso > pesoOriginal) {
        this._notificationService.showError(
          `El descuento en peso no puede ser mayor al peso original en la línea ${i + 1}`
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

    for (let i = 0; i < this.detalles.length; i++) {
      if (!this.validarPeso(i)) {
        return;
      }
    }

    this.isLoading.set(true);

    const formData = this.form.value;
    const ventaId = this.ventaId();

    if (!ventaId) {
      this._notificationService.showError('ID de venta no válido');
      this.isLoading.set(false);
      return;
    }

    // CORRECCIÓN: Preparar datos según la estructura que espera el backend
    const ventaData: any = {
      id_cliente: parseInt(formData.id_cliente),
      id_usuario: this.usuarioActual()?.id || 1,
      fecha_venta: formData.fecha_venta,
      subtotal: this.formatNumber(parseFloat(formData.subtotal) || 0),
      descuento: this.formatNumber(parseFloat(formData.descuento) || 0),
      total: this.formatNumber(parseFloat(formData.total) || 0),
      metodo_pago: formData.metodo_pago,
      estado: formData.estado,
      observaciones: formData.observaciones || '',
      // CORRECCIÓN: Enviar productos en lugar de detalles
      productos: formData.detalles.map((detalle: any) => ({
        productoId: detalle.productoId ? parseInt(detalle.productoId) : null,
        producto_codigo: detalle.producto_codigo,
        nombre_producto: detalle.nombre_producto,
        precio_por_kilo: this.formatNumber(parseFloat(detalle.precio_por_kilo)),
        precio_unitario: this.formatNumber(
          parseFloat(detalle.precio_unitario || detalle.precio_por_kilo)
        ),
        peso_original: this.formatNumber(parseFloat(detalle.peso_original)),
        descuento_peso: this.formatNumber(parseFloat(detalle.descuento_peso)),
        // peso_final y subtotal se calculan en el backend
      })),
    };

    console.log('Datos a enviar al backend para actualizar:', ventaData);

    this._ventaService.update(ventaId, ventaData).subscribe({
      next: (response) => {
        this._notificationService.showSuccess('Venta actualizada exitosamente');
        this.isLoading.set(false);
        // CORRECCIÓN: Redirigir a /ventas en lugar de /ventas/detalle
        this._router.navigate(['/ventas']);
      },
      error: (error) => {
        console.error('Error updating venta:', error);
        let errorMessage = 'Error al actualizar la venta';

        if (error.error?.message) {
          errorMessage += ': ' + error.error.message;
        } else if (error.error?.error) {
          errorMessage += ': ' + error.error.error;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }

        // Mostrar detalles específicos del error 400
        if (error.status === 400) {
          console.error('Detalles del error 400:', error.error);
          if (error.error.errors) {
            const validationErrors = error.error.errors;
            errorMessage += '. Errores de validación: ';
            Object.keys(validationErrors).forEach((key) => {
              errorMessage += `${key}: ${validationErrors[key].join(', ')}. `;
            });
          } else if (typeof error.error === 'string') {
            errorMessage += ': ' + error.error;
          }
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

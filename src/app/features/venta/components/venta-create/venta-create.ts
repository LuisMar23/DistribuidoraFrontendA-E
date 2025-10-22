import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  faUser,
  faBox,
  faWeightHanging,
  faDollarSign,
  faCalendarAlt,
  faPercent,
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
}

@Component({
  selector: 'app-venta-create',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './venta-create.html',
})
export class VentaCreateComponent {
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
  faUser = faUser;
  faBox = faBox;
  faWeightHanging = faWeightHanging;
  faDollarSign = faDollarSign;
  faCalendarAlt = faCalendarAlt;
  faPercent = faPercent;

  // Services
  private _notificationService = inject(NotificationService);
  private _router = inject(Router);
  private _clienteService = inject(ClientService);
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

  constructor() {
    this.form = this._fb.group({
      id_cliente: ['', Validators.required],
      fecha_venta: ['', Validators.required],
      subtotal: [0],
      descuento: [0],
      total: [0],
      metodo_pago: ['efectivo', Validators.required],
      estado: ['pendiente', Validators.required],
      observaciones: [''],
      // Campos para plan de pago - PARA TODOS LOS MÉTODOS
      monto_inicial: [0, [Validators.required, Validators.min(0)]],
      plazo: [30, [Validators.required, Validators.min(1)]], // Plazo manual
      periodicidad: ['DIAS', Validators.required], // Select de periodicidad
      fecha_inicio: ['', Validators.required], // Fecha editable
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
    try {
      let usuario: any = null;

      // Método 1: Intentar con el AuthService
      if (this._authService && typeof this._authService.getCurrentUser === 'function') {
        usuario = this._authService.getCurrentUser();
      }

      // Método 2: Buscar en localStorage
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

      // Configurar usuario encontrado
      if (usuario) {
        const usuarioOption: UsuarioOption = {
          id: usuario.id || 1,
          fullName: usuario.fullName || usuario.nombre || 'Usuario Sistema',
        };

        this.usuarioActual.set(usuarioOption);
      } else {
        // Usuario por defecto para desarrollo
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

    // Cargar productos EXISTENTES
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

    // NO ajustar automáticamente el monto inicial - el usuario lo ingresa manualmente
    // Solo mantener la fecha actual como sugerencia
    const fechaVenta = this.form.get('fecha_venta')?.value;
    if (fechaVenta && !this.form.get('fecha_inicio')?.value) {
      const fechaVentaDate = new Date(fechaVenta);
      this.form.patchValue({
        fecha_inicio: fechaVentaDate.toISOString().split('T')[0],
      });
    }
  }

  // Cuando cambia la fecha de inicio, recalcular vencimiento
  onFechaInicioChange() {
    // Recalcular automáticamente la fecha de vencimiento
    this.calcularFechaVencimiento();
  }

  // Cuando cambia el plazo o periodicidad, recalcular vencimiento
  onPlazoChange() {
    this.calcularFechaVencimiento();
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
        producto.id_producto.toString().includes(termino)
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
        // NO establecer nombre_producto automáticamente - el usuario lo ingresa manualmente
        precio_por_kilo: 0,
      });

      // Actualizar validación de stock
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
      return producto ? producto.peso_disponible : 0;
    }
    return 0;
  }

  // Getter para el FormArray de detalles
  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  // Calcular subtotal de un detalle - CORREGIDO
  calcularSubtotalDetalle(index: number) {
    if (index < 0 || index >= this.detalles.length) return;

    const detalle = this.detalles.at(index);
    const precioPorKilo = Number(detalle.get('precio_por_kilo')?.value) || 0;
    const pesoOriginal = Number(detalle.get('peso_original')?.value) || 0;
    const descuentoPeso = Number(detalle.get('descuento_peso')?.value) || 0;

    // Cálculo según backend: peso_final = peso_original - descuento_peso
    const pesoFinal = Math.max(0, pesoOriginal - descuentoPeso);

    // Cálculo según backend: subtotal = precio_por_kilo * peso_final
    const subtotal = precioPorKilo * pesoFinal;

    detalle.patchValue(
      {
        peso_final: pesoFinal,
        subtotal: subtotal,
      },
      { emitEvent: false }
    );

    this.actualizarTotales();
  }

  // Calcular descuento en dinero - CORREGIDO
  calcularDescuentoEnDinero(): number {
    let descuentoTotal = 0;
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      const precioPorKilo = Number(detalle.get('precio_por_kilo')?.value) || 0;
      const descuentoPeso = Number(detalle.get('descuento_peso')?.value) || 0;

      // Cálculo según backend: descuento_monetario = precio_por_kilo * descuento_peso
      descuentoTotal += precioPorKilo * descuentoPeso;
    }
    return descuentoTotal;
  }

  // Calcular subtotal total de todos los productos - CORREGIDO
  calcularSubtotalTotal(): number {
    let total = 0;
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      const subtotal = Number(detalle.get('subtotal')?.value) || 0;
      total += subtotal;
    }
    return total;
  }

  // Calcular total general - CORREGIDO
  calcularTotalGeneral(): number {
    const subtotal = this.calcularSubtotalTotal();
    const descuento = this.calcularDescuentoEnDinero();

    // CORRECCIÓN: El total SÍ debe ser subtotal - descuento
    return Math.max(0, subtotal - descuento);
  }

  // Agregar detalle
  agregarDetalle() {
    const detalleForm = this._fb.group({
      productoId: [''],
      producto_codigo: ['', Validators.required],
      nombre_producto: ['', Validators.required],
      precio_por_kilo: [0, [Validators.required, Validators.min(0)]],
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
          `Stock insuficiente. Solo hay ${producto.peso_disponible} kg disponibles.`
        );
        detalle.patchValue({ peso_original: producto.peso_disponible });
        this.calcularSubtotalDetalle(index);
        return false;
      }
    }
    return true;
  }

  // Actualizar totales - CORREGIDO
  actualizarTotales() {
    const subtotal = this.calcularSubtotalTotal();
    const descuento = this.calcularDescuentoEnDinero();
    const total = this.calcularTotalGeneral();

    this.form.patchValue({
      subtotal: subtotal,
      descuento: descuento,
      total: total,
    });

    // NO ajustar automáticamente el monto inicial - el usuario lo ingresa manualmente
    // Solo validar que no sea mayor al total
    const montoInicial = this.form.get('monto_inicial')?.value || 0;
    if (montoInicial > total) {
      // Mostrar advertencia pero no ajustar automáticamente
      console.warn('Monto inicial mayor al total, pero se mantiene para que el usuario lo corrija');
    }
  }

  onDescuentoChange() {
    this.actualizarTotales();
  }

  private setCurrentDateTime() {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    this.form.patchValue({
      fecha_venta: formattedDate,
      fecha_inicio: now.toISOString().split('T')[0], // Fecha actual como sugerencia
    });
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

    // Validar que el monto inicial no sea mayor al total
    const montoInicial = this.form.get('monto_inicial')?.value || 0;
    const total = this.form.get('total')?.value || 0;
    if (montoInicial > total) {
      this._notificationService.showError(
        `El monto inicial (Bs. ${montoInicial}) no puede ser mayor al total de la venta (Bs. ${total})`
      );
      return;
    }

    this.isLoading.set(true);

    const formData = this.form.value;

    // Preparar datos de la venta según el backend corregido
    const ventaData: any = {
      id_cliente: parseInt(formData.id_cliente),
      id_usuario: this.usuarioActual()!.id,
      fecha_venta: formData.fecha_venta,
      metodo_pago: formData.metodo_pago,
      estado: formData.estado,
      observaciones: formData.observaciones || '',
      productos: formData.detalles.map((detalle: any) => ({
        productoId: detalle.productoId ? parseInt(detalle.productoId) : undefined,
        producto_codigo: detalle.producto_codigo,
        nombre_producto: detalle.nombre_producto,
        precio_por_kilo: parseFloat(detalle.precio_por_kilo),
        peso_original: parseFloat(detalle.peso_original),
        descuento_peso: parseFloat(detalle.descuento_peso),
      })),
      plan_pago: {
        monto_inicial: parseFloat(formData.monto_inicial) || 0,
        plazo: parseInt(formData.plazo),
        periodicidad: formData.periodicidad,
        fecha_inicio: formData.fecha_inicio,
      },
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

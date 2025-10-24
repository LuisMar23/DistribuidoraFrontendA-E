import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  faShoppingCart,
  faEdit,
  faUser,
  faDollarSign,
  faCreditCard,
  faCalendarAlt,
  faSpinner,
  faExclamationTriangle,
  faHome,
  faArrowLeft,
  faReceipt,
  faList,
  faMoneyBillWave,
  faCheckCircle,
  faClock,
  faBox,
  faWeightHanging,
  faTag,
  faSyncAlt,
  faPlus,
  faSave,
  faTimes,
  faStickyNote,
  faPercent,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VentaService } from '../../services/venta.service';
import { VentaDto } from '../../../../core/interfaces/venta.interface';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  standalone: true,
  selector: 'app-venta-detalle',
  imports: [CommonModule, FontAwesomeModule, RouterModule, ReactiveFormsModule],
  templateUrl: './venta-detalle.html',
})
export class VentaDetalleComponent {
  // Iconos
  faShoppingCart = faShoppingCart;
  faEdit = faEdit;
  faUser = faUser;
  faDollarSign = faDollarSign;
  faCreditCard = faCreditCard;
  faCalendarAlt = faCalendarAlt;
  faSpinner = faSpinner;
  faExclamationTriangle = faExclamationTriangle;
  faHome = faHome;
  faArrowLeft = faArrowLeft;
  faReceipt = faReceipt;
  faList = faList;
  faMoneyBillWave = faMoneyBillWave;
  faCheckCircle = faCheckCircle;
  faClock = faClock;
  faBox = faBox;
  faWeightHanging = faWeightHanging;
  faTag = faTag;
  faSyncAlt = faSyncAlt;
  faPlus = faPlus;
  faSave = faSave;
  faTimes = faTimes;
  faStickyNote = faStickyNote;
  faPercent = faPercent;

  private route = inject(ActivatedRoute);
  private ventaService = inject(VentaService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  venta = signal<VentaDto | null>(null);
  isLoading = signal(false);
  mostrarModalPago = signal(false);

  // Formulario para pagos adicionales
  formPago: FormGroup;

  constructor() {
    // Formulario para pagos adicionales
    this.formPago = this.fb.group({
      monto: [0, [Validators.required, Validators.min(0.01)]],
      fecha_pago: ['', Validators.required],
      observacion: [''],
    });

    this.loadVenta();
    this.setCurrentDateTimePago();
  }

  loadVenta() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.ventaService.getById(id).subscribe({
        next: (venta) => {
          // Ya no hay descuento monetario, el total es igual al subtotal
          const ventaCorregida = {
            ...venta,
            total: venta.subtotal, // Total = Subtotal (sin descuento monetario)
          };
          this.venta.set(ventaCorregida);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading venta:', error);
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  // MÉTODOS PARA PAGOS ADICIONALES
  mostrarAgregarPago() {
    this.mostrarModalPago.set(true);
    this.setCurrentDateTimePago();

    // Resetear el monto a 0 para que el usuario lo ingrese manualmente
    this.formPago.patchValue({
      monto: 0,
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
      this.notificationService.showError('Complete todos los campos del pago');
      return;
    }

    const montoIngresado = this.formPago.value.monto;
    const saldoPendiente = this.calcularSaldoPendiente();

    // Validar que el monto no sea mayor al saldo pendiente
    if (montoIngresado > saldoPendiente) {
      this.notificationService.showError(
        `El monto no puede ser mayor al saldo pendiente (${saldoPendiente} Bs.)`
      );
      return;
    }

    // Validar que el monto sea mayor a 0
    if (montoIngresado <= 0) {
      this.notificationService.showError('El monto debe ser mayor a 0');
      return;
    }

    const planPago = this.getPlanPago();
    if (!planPago?.id_plan_pago) {
      this.notificationService.showError('No se encontró el plan de pago');
      return;
    }

    const pagoData = {
      plan_pago_id: planPago.id_plan_pago,
      monto: this.formatNumber(montoIngresado),
      fecha_pago: this.formPago.value.fecha_pago,
      observacion: this.formPago.value.observacion || 'Pago adicional',
    };

    this.isLoading.set(true);

    this.ventaService.registrarPagoPlan(pagoData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Pago registrado exitosamente');
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

        this.notificationService.showError(errorMessage);
        this.isLoading.set(false);
      },
    });
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

  getEstadoClass(estado: string | undefined): string {
    switch (estado) {
      case 'pagado':
        return 'bg-green-500 text-white';
      case 'pendiente':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getPlanPago(): any {
    const ventaData = this.venta();
    return ventaData?.planPago || null;
  }

  // Calcular total pagado correctamente
  calcularTotalPagado(): number {
    const planPago = this.getPlanPago();
    if (!planPago?.pagos) return 0;
    return planPago.pagos.reduce((total: number, pago: any) => total + Number(pago.monto), 0);
  }

  // Calcular saldo pendiente usando el total de la venta (que ahora es igual al subtotal)
  calcularSaldoPendiente(): number {
    const totalVenta = this.getTotal() || 0;
    const totalPagado = this.calcularTotalPagado();
    return Math.max(0, totalVenta - totalPagado);
  }

  tienePlanPago(): boolean {
    return !!this.getPlanPago();
  }

  calcularSubtotalDetalle(detalle: any): number {
    return Number(detalle.subtotal) || 0;
  }

  // Método para calcular el total por detalle (solo subtotal, sin descuento monetario)
  calcularTotalDetalle(detalle: any): number {
    const subtotal = this.calcularSubtotalDetalle(detalle);
    return Math.max(0, subtotal);
  }

  // Método para calcular el total final de todos los detalles
  getTotalFinalDetalles(): number {
    return this.getDetalles().reduce(
      (total, detalle) => total + this.calcularTotalDetalle(detalle),
      0
    );
  }

  getTotalPesoFinal(): number {
    return this.getDetalles().reduce((acc, detalle) => acc + (detalle.peso_final || 0), 0);
  }

  getTotalSubtotalDetalles(): number {
    return this.getDetalles().reduce(
      (total, detalle) => total + (Number(detalle.subtotal) || 0),
      0
    );
  }

  getVentaId(): number {
    return this.venta()?.id_venta || 0;
  }

  // Muestra el nombre del cliente igual que en el listado
  getClienteNombre(): string {
    const cliente = this.venta()?.cliente;
    if (!cliente) return 'Cliente N/A';

    // Si tiene persona con nombre y apellido
    if (cliente.persona?.nombre) {
      const nombreCompleto = cliente.persona.nombre
        ? `${cliente.persona.nombre} ${cliente.persona.apellido || ''}`.trim()
        : 'Cliente sin nombre';
      return nombreCompleto;
    }

    // Si tiene nombre directo (sin 'persona')
    if (cliente.nombre) {
      return cliente.nombre;
    }

    // Fallback
    return 'Cliente ' + (this.venta()?.id_cliente || 'N/A');
  }

  getEstado(): string {
    return this.venta()?.estado || 'N/A';
  }

  getIdCliente(): number {
    return this.venta()?.id_cliente || 0;
  }

  getFechaVenta(): string {
    return this.venta()?.fecha_venta || '';
  }

  getMetodoPago(): string {
    return this.venta()?.metodo_pago || 'N/A';
  }

  getObservaciones(): string {
    return this.venta()?.observaciones || 'Sin observaciones';
  }

  getSubtotal(): number {
    return this.venta()?.subtotal || 0;
  }

  // Ya no existe descuento monetario, solo descuento de peso
  getDescuentoPesoTotal(): number {
    return this.venta()?.descuento || 0; // Ahora 'descuento' representa el descuento de peso total
  }

  // SIEMPRE devolver el total calculado correctamente (subtotal)
  getTotal(): number {
    const ventaData = this.venta();
    if (!ventaData) return 0;
    return ventaData.subtotal || 0; // Total = Subtotal (sin descuento monetario)
  }

  getDetalles(): any[] {
    return this.venta()?.detalles || [];
  }

  tieneDetalles(): boolean {
    const detalles = this.venta()?.detalles;
    return !!detalles && detalles.length > 0;
  }

  esCredito(): boolean {
    return this.venta()?.metodo_pago?.toLowerCase() === 'credito';
  }

  // Calcular porcentaje pagado usando el total de la venta
  calcularPorcentajePagado(): number {
    const totalVenta = this.getTotal() || 0;
    const pagado = this.calcularTotalPagado();
    if (totalVenta === 0) return 0;
    return (pagado / totalVenta) * 100;
  }

  // NUEVOS MÉTODOS PARA LA SECCIÓN ESPECÍFICA DEL PLAN DE PAGO

  // Obtener fecha de inicio del plan de pago
  getFechaInicioPlanPago(): string {
    const planPago = this.getPlanPago();
    if (!planPago?.fecha_inicio) return 'N/A';

    const date = new Date(planPago.fecha_inicio);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  // Obtener periodicidad en texto
  getPeriodicidadTexto(): string {
    const planPago = this.getPlanPago();
    const periodicidad = planPago?.periodicidad;
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

  // Obtener monto inicial del plan de pago
  getMontoInicial(): number {
    const planPago = this.getPlanPago();
    return planPago?.monto_inicial || 0;
  }

  // Obtener pagos existentes
  getPagosExistentes(): any[] {
    const planPago = this.getPlanPago();
    return planPago?.pagos || [];
  }

  // Calcular fecha de vencimiento (igual que en editar)
  calcularFechaVencimiento(): string {
    const planPago = this.getPlanPago();
    const fechaInicio = planPago?.fecha_inicio;
    const plazo = planPago?.plazo;
    const periodicidad = planPago?.periodicidad;

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

  // Obtener plazo del plan de pago
  getPlazo(): number {
    const planPago = this.getPlanPago();
    return planPago?.plazo || 0;
  }
}

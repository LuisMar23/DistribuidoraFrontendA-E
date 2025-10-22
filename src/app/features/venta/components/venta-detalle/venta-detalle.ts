import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
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
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VentaService } from '../../services/venta.service';
import { VentaDto } from '../../../../core/interfaces/venta.interface';

@Component({
  standalone: true,
  selector: 'app-venta-detalle',
  imports: [CommonModule, FontAwesomeModule, RouterModule],
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

  private route = inject(ActivatedRoute);
  private ventaService = inject(VentaService);

  loading = signal(true);
  venta = signal<VentaDto | null>(null);

  constructor() {
    this.loadVenta();
  }

  loadVenta() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.ventaService.getById(id).subscribe({
        next: (venta) => {
          // CORRECCIÓN: Aplicar cálculo correcto del total
          const ventaCorregida = {
            ...venta,
            total: this.calcularTotalCorrecto(venta),
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

  getEstadoClass(estado: string | undefined): string {
    switch (estado) {
      case 'pagado':
        return 'bg-green-500 text-white';
      case 'pendiente':
        return 'bg-yellow-500 text-white';
      case 'anulado':
        return 'bg-red-500 text-white';
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

  // CORRECCIÓN: Calcular total pagado correctamente
  calcularTotalPagado(): number {
    const planPago = this.getPlanPago();
    if (!planPago?.pagos) return 0;
    return planPago.pagos.reduce((total: number, pago: any) => total + Number(pago.monto), 0);
  }

  // CORRECCIÓN PRINCIPAL: Calcular total correctamente (subtotal - descuento)
  calcularTotalCorrecto(venta: VentaDto): number {
    const subtotal = Number(venta.subtotal) || 0;
    const descuento = Number(venta.descuento) || 0;
    return Math.max(0, subtotal - descuento);
  }

  // CORRECCIÓN: Calcular saldo pendiente usando el total CORRECTO de la venta
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

  // NUEVO: Método para calcular el total por detalle (subtotal - descuento en dinero)
  calcularTotalDetalle(detalle: any): number {
    const subtotal = this.calcularSubtotalDetalle(detalle);
    const descuentoMonto =
      Number(detalle.descuento_peso || 0) * Number(detalle.precio_por_kilo || 0);
    return Math.max(0, subtotal - descuentoMonto);
  }

  // NUEVO: Método para calcular el total final de todos los detalles
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

  // CORREGIDO: Muestra el nombre del cliente igual que en el listado
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

  getDescuento(): number {
    return this.venta()?.descuento || 0;
  }

  // CORRECCIÓN: SIEMPRE devolver el total calculado correctamente
  getTotal(): number {
    const ventaData = this.venta();
    if (!ventaData) return 0;
    return this.calcularTotalCorrecto(ventaData);
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

  // CORRECCIÓN: Calcular porcentaje pagado usando el total CORRECTO de la venta
  calcularPorcentajePagado(): number {
    const totalVenta = this.getTotal() || 0;
    const pagado = this.calcularTotalPagado();
    if (totalVenta === 0) return 0;
    return (pagado / totalVenta) * 100;
  }

  // CORRECCIÓN PRINCIPAL: Obtener el total del plan de pago (DEBE ser igual al total CORRECTO de la venta)
  getTotalPlanPago(): number {
    // SIEMPRE usar el total calculado correctamente de la venta
    // en lugar del valor almacenado en planPago.total
    return this.getTotal();
  }

  // CORRECCIÓN: Obtener mano obra del plan de pago
  getManoObra(): number {
    const planPago = this.getPlanPago();
    return planPago?.mano_obra || 0;
  }

  // CORRECCIÓN: Obtener plazo del plan de pago
  getPlazo(): number {
    const planPago = this.getPlanPago();
    return planPago?.plazo || 0;
  }

  // CORRECCIÓN: Obtener fecha de vencimiento del plan de pago
  getFechaVencimiento(): string {
    const planPago = this.getPlanPago();
    if (!planPago?.fecha_vencimiento) return 'N/A';

    const date = new Date(planPago.fecha_vencimiento);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // CORRECCIÓN: Verificar si los cálculos del plan de pago son consistentes con el total CORRECTO
  esPlanPagoConsistente(): boolean {
    const totalVenta = this.getTotal();
    const totalPlanPagoAlmacenado = this.getPlanPago()?.total || 0;
    return Math.abs(totalVenta - totalPlanPagoAlmacenado) < 0.01; // Tolerancia para decimales
  }
}

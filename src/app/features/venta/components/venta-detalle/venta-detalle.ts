import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  faShoppingCart,
  faEdit,
  faHashtag,
  faUser,
  faUserTie,
  faUserCog,
  faDollarSign,
  faTag,
  faCalculator,
  faCreditCard,
  faToggleOn,
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
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VentaService } from '../../services/venta.service';
import { VentaDto } from '../../../../core/interfaces/venta.interface';

@Component({
  standalone: true,
  selector: 'app-venta-detalle',
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './venta-detalle.html',
  styleUrl: './venta-detalle.css',
})
export class VentaDetalleComponent {
  faShoppingCart = faShoppingCart;
  faEdit = faEdit;
  faHashtag = faHashtag;
  faUser = faUser;
  faUserTie = faUserTie;
  faUserCog = faUserCog;
  faDollarSign = faDollarSign;
  faTag = faTag;
  faCalculator = faCalculator;
  faCreditCard = faCreditCard;
  faToggleOn = faToggleOn;
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
          this.venta.set(venta);
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

  // Método auxiliar para obtener el plan de pago con diferentes nombres posibles
  getPlanPago(): any {
    const ventaData = this.venta();
    if (!ventaData) return null;

    return ventaData.PlanPago || ventaData.planPago || ventaData.plan_pago;
  }

  // Métodos para calcular totales del plan de pago
  calcularTotalPagado(): number {
    const planPago = this.getPlanPago();
    if (!planPago?.pagos) return 0;

    return planPago.pagos.reduce((total: number, pago: any) => total + Number(pago.monto), 0);
  }

  calcularSaldoPendiente(): number {
    const planPago = this.getPlanPago();
    if (!planPago) return 0;

    const total = Number(planPago.total);
    const pagado = this.calcularTotalPagado();
    return Math.max(0, total - pagado);
  }

  // Verificar si tiene plan de pago
  tienePlanPago(): boolean {
    return !!this.getPlanPago();
  }
}

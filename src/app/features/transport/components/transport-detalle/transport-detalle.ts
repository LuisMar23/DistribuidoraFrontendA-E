import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  faTruck,
  faEdit,
  faHashtag,
  faShoppingCart,
  faUserTie,
  faTruckLoading,
  faDollarSign,
  faMoneyBillWave,
  faToggleOn,
  faCalendarAlt,
  faCalendarCheck,
  faSpinner,
  faExclamationTriangle,
  faHome,
  faArrowLeft,
  faBox,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TransportService } from '../../services/transport.service';

@Component({
  standalone: true,
  selector: 'app-transport-detalle',
  imports: [CommonModule, FontAwesomeModule, RouterModule, CurrencyPipe, DatePipe],
  templateUrl: './transport-detalle.html',
  styleUrl: './transport-detalle.css',
})
export class TransportDetalle {
  // Iconos
  faTruck = faTruck;
  faEdit = faEdit;
  faHashtag = faHashtag;
  faShoppingCart = faShoppingCart;
  faUserTie = faUserTie;
  faTruckLoading = faTruckLoading;
  faDollarSign = faDollarSign;
  faMoneyBillWave = faMoneyBillWave;
  faToggleOn = faToggleOn;
  faCalendarAlt = faCalendarAlt;
  faCalendarCheck = faCalendarCheck;
  faSpinner = faSpinner;
  faExclamationTriangle = faExclamationTriangle;
  faHome = faHome;
  faArrowLeft = faArrowLeft;
  faBox = faBox;

  private route = inject(ActivatedRoute);
  private _transportService = inject(TransportService);

  loading = signal(true);
  transporte = toSignal(
    this._transportService.getById(Number(this.route.snapshot.paramMap.get('id')))
  );

  constructor() {
    console.log(this.transporte());
    effect(() => {
      if (this.transporte() !== undefined) {
        this.loading.set(false);
      }
    });
  }

  // Función auxiliar para determinar la clase del estado
  getEstadoClass(estado: string | undefined): string {
    switch (estado) {
      case 'entregado':
        return 'bg-green-500 text-white';
      case 'en_camino':
        return 'bg-yellow-500 text-white';
      case 'pendiente':
        return 'bg-blue-500 text-white';
      case 'cancelado':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }
}

// src/proveedor/components/proveedor-detalle.component.ts
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  faUserTie,
  faEdit,
  faTrashAlt,
  faIdCard,
  faPhoneAlt,
  faMapMarkerAlt,
  faBuilding,
  faToggleOn,
  faCalendarAlt,
  faSpinner,
  faExclamationTriangle,
  faHome,
  faShop,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  standalone: true,
  selector: 'app-proveedor-detalle',
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './proveedor-detalle.html',
  styleUrl: './proveedor-detalle.css',
})
export class ProveedorDetalle {
  faUserTie = faUserTie;
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;
  faIdCard = faIdCard;
  faPhoneAlt = faPhoneAlt;
  faMapMarkerAlt = faMapMarkerAlt;
  faBuilding = faBuilding;
  faToggleOn = faToggleOn;
  faCalendarAlt = faCalendarAlt;
  faSpinner = faSpinner;
  faExclamationTriangle = faExclamationTriangle;
  faHome = faHome;
  faShop = faShop;

  private route = inject(ActivatedRoute);
  private _proveedorService = inject(ProveedorService);

  loading = signal(true);

  proveedor = toSignal(
    this._proveedorService.getById(Number(this.route.snapshot.paramMap.get('id')))
  );

  // Optional: efecto para manejar el loading
  constructor() {
    console.log(this.proveedor());
    effect(() => {
      if (this.proveedor()) {
        this.loading.set(false);
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faShoppingCart,
  faUsers,
  faBox,
  faCashRegister,
  faTruck,
  faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { ProveedorService } from '../features/proveedor/services/proveedor.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  faShoppingCart = faShoppingCart;
  faUsers = faUsers;
  faBox = faBox;
  faCashRegister = faCashRegister;
  faTruck = faTruck;
  faUserShield = faUserShield;
  private _proveedorService = inject(ProveedorService);

  proveedores$ = this._proveedorService.count();
  // Datos simulados, luego los reemplazas por tu API
  ventasHoy = 12345;
  clientesActivos = 245;
  productosVendidos = 1234;
  balanceCaja = 5678;
  usuarios = 2;
}

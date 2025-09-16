import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingCart, faUsers, faBox, faCashRegister } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-dashboard',
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  faShoppingCart = faShoppingCart;
  faUsers = faUsers;
  faBox = faBox;
  faCashRegister = faCashRegister;

  // Datos simulados, luego los reemplazas por tu API
  ventasHoy = 12345;
  clientesActivos = 245;
  productosVendidos = 1234;
  balanceCaja = 5678;
}

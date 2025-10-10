import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faShoppingCart,
  faBox,
  faUsers,
  faTruck,
  faCreditCard,
  faCashRegister,
  faCog,
  faBars,
  faChevronLeft,
  faTimes,
  faStore,
  faTachometerAlt,
  faBuilding,
  faShoppingBag,
  faCow,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  faTimes = faTimes;
  faBars = faBars;
  faChevronLeft = faChevronLeft;
  faUsers = faUsers;
  faStore = faStore;
  faTachometerAlt = faTachometerAlt;
  faBuilding = faBuilding;
  faShoppingBag = faShoppingBag;
  faCow = faCow;

  @Output() sidebarToggled = new EventEmitter<boolean>();

  imagen: string = 'assets/logoSistemaVenta.png';

  isCollapsed = false;
  isMobileOpen = false;

  menu: { label: string; icon: IconDefinition; route: string }[] = [
    { label: 'Dashboard', icon: faTachometerAlt, route: '/dashboard' },
    { label: 'Proveedores', icon: faStore, route: '/proveedores' },
    { label: 'Compras', icon: faShoppingBag, route: '/compras' },
    { label: 'Faenas', icon: faCow, route: '/faenas' },
    { label: 'Ventas', icon: faShoppingCart, route: '/ventas' },
    { label: 'Productos', icon: faBox, route: '/productos' },
    { label: 'Clientes', icon: faUsers, route: '/clientes' },
    { label: 'Transporte', icon: faTruck, route: '/transporte' },
    { label: 'Pagos', icon: faCreditCard, route: '/pagos' },
    { label: 'Caja', icon: faCashRegister, route: '/caja' },
    { label: 'Usuarios', icon: faUsers, route: '/users' },
    { label: 'Ajustes', icon: faCog, route: '/ajustes' },
  ];

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggled.emit(this.isCollapsed);
  }

  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
  }
}

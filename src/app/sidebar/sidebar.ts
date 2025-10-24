import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, inject } from '@angular/core';
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
import { AuthService } from '../components/services/auth.service';

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
  private authSvc = inject(AuthService);
  @Output() sidebarToggled = new EventEmitter<boolean>();

  imagen: string = 'assets/logoSistemaVenta.png';

  isCollapsed = false;
  isMobileOpen = false;
  ngOnInit(): void {
    const role = this.authSvc.getUserRole();
    if (role !== 'ADMIN' && role !== 'SYSADMIN') {
      this.menu = this.menu.filter((item) => item.route !== '/pagos' && item.route !== '/usuarios');
    }
  }
  menu: { label: string; icon: IconDefinition; route: string }[] = [
    { label: 'Inicio', icon: faTachometerAlt, route: '/dashboard' },
    { label: 'Proveedores', icon: faStore, route: '/proveedores' },
    { label: 'Compras', icon: faShoppingBag, route: '/compras' },
    { label: 'Menudo', icon: faCow, route: '/faenas' },
    { label: 'Ventas', icon: faShoppingCart, route: '/ventas' },
    { label: 'Productos', icon: faBox, route: '/productos' },
    { label: 'Clientes', icon: faUsers, route: '/clientes' },
    { label: 'Pagos', icon: faCreditCard, route: '/pagos' },
    { label: 'Caja', icon: faCashRegister, route: '/caja' },
    { label: 'Usuarios', icon: faUsers, route: '/usuarios' },
  ];

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggled.emit(this.isCollapsed);
  }

  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
  }
}

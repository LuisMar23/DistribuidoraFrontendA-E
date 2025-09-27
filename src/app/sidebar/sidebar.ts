import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHome,
  faShoppingCart,
  faBox,
  faUsers,
  faTruck,
  faCreditCard,
  faCashRegister,
  faCog,
  faBars,
  faChevronLeft,
  faChevronRight,
  faAnglesLeft,
  faAnglesRight,
  faSun,
  faMoon,
  faTimes,
  faStore,
  faTachometerAlt,
  faCow,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  faTimes = faTimes;
  faBars = faBars;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faAnglesLeft = faAnglesLeft;
  faAnglesRight = faAnglesRight;
  faSun = faSun;
  faMoon = faMoon;
  faUsers=faUsers
  faStore=faStore
  faCow=faCow;
 faDashboard = faTachometerAlt;
  imagen:string=''
  constructor(){
    this.imagen='assets/logoAE.png'
  }
  isCollapsed = false;

  menu: { label: string; icon: IconDefinition; route: string }[] = [
    { label: 'Dashboard', icon:faTachometerAlt, route: '/dashboard' },
    { label: 'Proveedores', icon: faStore, route: '/proveedores' },
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
  }

  isDarkMode = false;
  isMobileOpen = false;

  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
  }
}

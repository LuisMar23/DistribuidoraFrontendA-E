import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBell,
  faChevronDown,
  faCog,
  faLayerGroup,
  faSearch,
  faShieldAlt,
  faSignOutAlt,
  faUser,
  faUserCircle,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-navbar',
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  faBell = faBell;
  faUserCircle = faUserCircle;
  faChevronDown = faChevronDown;
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  faShieldAlt=faShieldAlt;
  faLayerGroup=faLayerGroup;
  faSearch=faSearch;
  faCog=faCog

  isUserMenuOpen: boolean = false;

  currentUser = {
    username: 'Admin',
  };

  notifications = [
    { id: 1, message: 'Nuevo pedido recibido' },
    { id: 2, message: 'Pago confirmado' },
  ];

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    console.log('Cerrar sesión');
    // Aquí va tu lógica de logout
  }
}

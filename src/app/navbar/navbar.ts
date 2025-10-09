import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
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
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../components/services/auth.service';
import { UserService } from '../features/users/services/users.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  faBell = faBell;
  faChevronDown = faChevronDown;
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  faShieldAlt=faShieldAlt;
  faLayerGroup=faLayerGroup;
  faSearch=faSearch;
  faCog=faCog
  serverFile=environment.fileServer
  isUserMenuOpen: boolean = false;
 currentUser = signal<{ username: string; avatarUrl: string }>({ username: '', avatarUrl: 'assets/default.jpg' });

  // CORREGIDO: Solo una definición de currentUser usando signal


  _authService = inject(AuthService);
  _userService = inject(UserService); // Agregado el UserService

  notifications = [
    { id: 1, message: 'Nuevo pedido recibido' },
    { id: 2, message: 'Pago confirmado' },
  ];

  ngOnInit() {
    this.loadUser();
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    this._authService.logout();
  }

  loadUser() {
    this._userService.getProfile().subscribe((user) => {
      // actualizar señal
      this.currentUser.set({
        username: user.username,
        // avatarUrl: user.avatarUrl ? `http://localhost:3000/${user.avatarUrl}` : '/assets/default.jpg',
                avatarUrl: user.avatarUrl ? `${this.serverFile}/${user.avatarUrl}` : 'assets/default.jpg',
      });
    });
  }
}

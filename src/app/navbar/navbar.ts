import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
import { AuthService } from '../components/services/auth.service';
import { AppRoutingModule } from "../app.routes";
import { RouterModule } from '@angular/router';
import { UserService } from '../features/users/services/users.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-navbar',
  imports: [FontAwesomeModule, CommonModule,RouterModule],
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
  serverFile=environment.fileServer
  isUserMenuOpen: boolean = false;
 currentUser = signal<{ username: string; avatarUrl: string }>({ username: '', avatarUrl: 'assets/default.jpg' });

  private _authService=inject(AuthService)
  private _userService = inject(UserService);
  constructor() {
    this.loadUser();
  }

  notifications = [
    { id: 1, message: 'Nuevo pedido recibido' },
    { id: 2, message: 'Pago confirmado' },
  ];

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    this._authService.logout()
  }
    loadUser() {
    this._userService.getProfile().subscribe(user => {
      // actualizar señal
      this.currentUser.set({
        username: user.username,
        // avatarUrl: user.avatarUrl ? `http://localhost:3000/${user.avatarUrl}` : '/assets/default.jpg',
                avatarUrl: user.avatarUrl ? `${this.serverFile}/${user.avatarUrl}` : 'assets/default.jpg',
      });
    });
  }
}

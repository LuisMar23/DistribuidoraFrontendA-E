import { Component, inject, OnInit } from '@angular/core';
import { faCogs, faEdit, faEnvelope, faSearch, faTrash, faUser, faUserCircle, faUsers, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../components/services/auth.service';
import { UserService } from '../services/users.service';
import { UserDto } from '../../interfaces/user.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FontAwesomeModule,FormsModule,CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersComponent implements OnInit {
  faEdit = faEdit;
  faTrash = faTrash;



    faUsers = faUsers;
  faSearch = faSearch;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faUserShield = faUserShield;
  faCogs = faCogs;
  faUserCircle = faUserCircle;


  users: UserDto[] = [];
  allUsers:any
  currentUser: any;
  
  _authService = inject(AuthService);
  _usersService = inject(UserService);
  constructor() {}

  ngOnInit() {}
  loadUsers() {
    this._usersService.getAll().subscribe({
      next: (data) => {
        this.allUsers = data; // guardamos todos los usuarios
        this.applyFilter(); // aplicamos filtro al cargar
      },
      error: (err: any) => console.error(err),
    });
  }
  searchTerm=''
  applyFilter() {
    if (!this.searchTerm) {
      this.users = this.allUsers;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.users = this.allUsers.filter(
        (user:any) =>
          user.username.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.role.toLowerCase().includes(term)
      );
    }
  }
  editRole(user: any) {
    const newRole = prompt(`Asignar nuevo rol a ${user.username}:`, user.role);
    if (newRole && newRole !== user.role) {
      this._usersService.updateRole(user.id, newRole).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error(err),
      });
    }
  }

  deleteUser(user: any) {
    if (confirm(`¿Deseas eliminar al usuario ${user.username}?`)) {
      this._usersService.delete(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (err: any) => console.error(err),
      });
    }
  }
}

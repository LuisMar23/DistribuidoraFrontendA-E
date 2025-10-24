import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  faEdit,
  faSearch,
  faTrash,
  faUser,
  faUserCircle,
  faUsers,
  faUserTimes,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../../components/services/auth.service';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserDto } from '../../../../core/interfaces/user.interface';
import { UserService } from '../../services/users.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FontAwesomeModule, FormsModule, CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersComponent implements OnInit {
  // FontAwesome
  faEdit = faEdit;
  faTrash = faTrash;
  faUserTimes = faUserTimes;
  faUsers = faUsers;
  faSearch = faSearch;
  faUser = faUser;
  faUserCircle = faUserCircle;
  faUsuario=faUser;

  // Signals
  allUsers = signal<any[]>([]);
  searchTerm = signal('');
  selectedUser = signal<any | null>(null);
  selectedRole = signal<string>('');
  showModal = signal(false);

  // Roles
  roles = ['ADMIN','USER'];

  users = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allUsers();
    return this.allUsers().filter(
      (user) => user.username.toLowerCase().includes(term) || user.role.toLowerCase().includes(term)
    );
  });

  // Servicios
  private _authService = inject(AuthService);
  private _usersService = inject(UserService);
  private _notificationService = inject(NotificationService);

  constructor() {
    this.loadUsers();
  }

  ngOnInit() {}

  loadUsers() {
    this._usersService.getAll().subscribe({
      next: (data) => this.allUsers.set(data),
      error: (err) => console.error(err),
    });
  }

  deleteUser(user: UserDto) {
    this._notificationService
      .confirmDelete(`Se eliminará al usuario ${user.username}`)
      .then((result) => {
        if (result.isConfirmed) {
          this._usersService.delete(user.id).subscribe({
            next: () => {
              this._notificationService.showSuccess('Eliminado correctamente');
              this.loadUsers();
            },
            error: (err) => console.error(err),
          });
        }
      });
  }

  openModal(user: UserDto) {
    this.selectedUser.set(user);
    this.selectedRole.set(user.role);
    this.showModal.set(true);
  }

  updateRole() {
    const user = this.selectedUser();
    if (!user) return;

    this.showModal.set(false);
    console.log(this.selectedRole())
    this._usersService.updateRole(user.id, this.selectedRole()).subscribe({
      next: () => {
        this._notificationService.showSuccess(
          `Rol de ${user.username} actualizado a ${this.selectedRole()}`
        );

        this.allUsers.update((users) =>
          users.map((u) => (u.id === user.id ? { ...u, role: this.selectedRole() } : u))
        );
      },
    });
  }
}

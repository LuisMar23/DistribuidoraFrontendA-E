import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../services/users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private _notificationService = inject(NotificationService);
  serverFile = environment.fileServer;
  userId = 1; // ⚡ Cambiar dinámicamente según auth

  // Signals
  avatarFile = signal<File | null>(null);
  avatarUrlBackend = signal<string>('/assets/default.jpg');

  // Formulario reactivo
  profileForm = this.fb.group({
    fullName: this.fb.control('', Validators.required),
    username: this.fb.control('', Validators.required),
    telefono: this.fb.control('', Validators.required),
    nit_ci: this.fb.control(''), // si quieres mostrar
    direccion: this.fb.control(''), // si quieres mostrar
  });

  avatarPreview = computed(() => {
    return this.avatarFile() ? URL.createObjectURL(this.avatarFile()!) : this.avatarUrlBackend();
  });

  constructor() {
    this.loadProfile();
  }

  loadProfile() {
    this.userService.getProfile().subscribe((user) => {
      // Ahora extraemos datos de la relación persona
      const persona = user.persona || {};
      this.profileForm.patchValue({
        fullName: persona.nombre || '',
        username: user.username || '',
        telefono: persona.telefono || '',
        nit_ci: persona.nit_ci || '',
        direccion: persona.direccion || '',
      });

      if (user.avatarUrl) {
        this.avatarUrlBackend.set(`${this.serverFile}/${user.avatarUrl}`);
      } else {
        this.avatarUrlBackend.set('assets/default.jpg');
      }

      this.avatarFile.set(null);
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.avatarFile.set(input.files[0]);
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    const formData = new FormData();
    Object.entries(this.profileForm.value).forEach(([key, value]) => {
      if (value) formData.append(key, value as string);
    });

    if (this.avatarFile()) formData.append('avatar', this.avatarFile()!);

    this.userService.updateProfile(this.userId, formData).subscribe({
      next: () => {
        this._notificationService.showAlert('Perfil actualizado ✅');
        this.loadProfile();
      },
      error: (err) => this._notificationService.showAlert('Error al actualizar: ' + err.message),
    });
  }

  deleteAvatar() {
    this.userService.deleteAvatar().subscribe({
      next: () => {
        this.avatarUrlBackend.set('assets/default.jpg');
        this.avatarFile.set(null);
        this._notificationService.showAlert('Avatar eliminado ✅');
      },
      error: (err) => this._notificationService.showAlert(`Error: ${err.message}`),
    });
  }
}


import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, ChangePasswordResponse } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css'],
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  passwordChanged = signal(false);
  changedUser = signal<{ username: string; fullName: string } | null>(null);

  // Variables para mostrar/ocultar contraseña
  showNewPassword = false;
  showConfirmPassword = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  constructor() {
    this.changePasswordForm = this.fb.group(
      {
        ci: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    this.changePasswordForm.markAllAsTouched();

    if (this.changePasswordForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      const changePasswordData = {
        ci: this.changePasswordForm.get('ci')?.value,
        newPassword: this.changePasswordForm.get('newPassword')?.value,
        confirmPassword: this.changePasswordForm.get('confirmPassword')?.value,
      };

      this.authService.changePassword(changePasswordData).subscribe({
        next: (response: ChangePasswordResponse) => {
          this.changedUser.set({
            username: response.user.username,
            fullName: response.user.fullName,
          });
          this.passwordChanged.set(true);
          this.loading.set(false);
          this.changePasswordForm.reset();

          // Limpiar las variables de mostrar contraseña
          this.showNewPassword = false;
          this.showConfirmPassword = false;
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al cambiar la contraseña');
          this.loading.set(false);
        },
      });
    }
  }

  get ci() {
    return this.changePasswordForm.get('ci');
  }

  get newPassword() {
    return this.changePasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.changePasswordForm.get('confirmPassword');
  }
}

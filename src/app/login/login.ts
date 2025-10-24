import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../components/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { faEye, faEyeSlash, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  faUser = faUser;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  loginForm: FormGroup;
  showPassword: boolean = false;
  _authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', Validators.required],
      rememberMe: [false],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.valid) {

      const formData = this.loginForm.value;
      console.log('Formulario válido', {
        identifier: formData.identifier,
        rememberMe: formData.rememberMe,
        password: '***',
      });

      const data = this.loginForm.getRawValue();

      this._authService.login(data).subscribe({
        next: () => {
          this.notificationService.showSuccess('¡Inicio de sesión exitoso!');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.handleLoginError(error);
        },
      });
    } else {
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });
      this.notificationService.showWarning('Por favor, completa todos los campos requeridos');
    }
  }

  private handleLoginError(error: any): void {
    const errorMessage = error.error?.message || error.message || '';

    if (
      errorMessage.includes('bloqueó') ||
      errorMessage.includes('bloqueada') ||
      errorMessage.includes('minutos')
    ) {
      this.notificationService.showError(errorMessage);
    } else {

      this.notificationService.showError(
        'No se pudo iniciar sesión. Verifica tus datos e intenta nuevamente.'
      );
    }
  }
}

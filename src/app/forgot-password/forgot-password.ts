import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../components/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  emailSent = signal(false);
  submittedEmail = signal('');

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');
      
      const email = this.forgotPasswordForm.value.email;
      
      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.submittedEmail.set(email);
          this.emailSent.set(true);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al enviar el correo de recuperación');
          this.loading.set(false);
        }
      });
    }
  }

  resendEmail(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    
    this.authService.forgotPassword(this.submittedEmail()).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al reenviar el correo');
        this.loading.set(false);
      }
    });
  }
}
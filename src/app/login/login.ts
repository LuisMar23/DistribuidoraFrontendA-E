import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sidebar } from "../sidebar/sidebar";
import { DashboardComponent } from "../dashboard/dashboard";
import { AuthService } from '../components/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  _authService = inject(AuthService)

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      console.log('Formulario válido', this.loginForm.value);
      const data = this.loginForm.getRawValue()
      console.log(data)
      this._authService.login(data).subscribe({next :()=>{console.log("prueba")}})
      // Aquí iría la lógica de autenticación
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}

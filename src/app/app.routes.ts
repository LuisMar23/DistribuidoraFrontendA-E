import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { LayoutComponent} from './layout/layout';
import { ForgotPasswordComponent } from './forgot-password/forgot-password'; 

export const routes: Routes = [
  { path: 'forgot-password', component: ForgotPasswordComponent }, // Ruta corregida
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent }, // Ruta principal
    ],
  },
  { path: '**', redirectTo: '' }, // Redirige a la ruta principal
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
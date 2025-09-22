import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { LayoutComponent } from './layout/layout';
import { RegisterComponent } from './components/auth/register/register';
import { UsersComponent } from './users/users';
import { ProveedorComponent } from './proveedor/proveedor';
import { ForgotPasswordComponent } from './forgot-password/forgot-password';
import { TransportComponent } from './transport/transport';
import { ProductComponent } from './product/product';
import { ClientComponent } from './client/client';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // { path: '', component: DashboardComponent }, // prueba sin Layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UsersComponent },
      { path: 'clientes', component: ClientComponent },
      { path: 'productos', component: ProductComponent },
      { path: 'proveedores', component: ProveedorComponent },
      { path: 'transporte', component: TransportComponent },
    ],
  },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  { path: '**', redirectTo: '/login' },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

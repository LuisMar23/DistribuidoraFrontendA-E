import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { LayoutComponent } from './layout/layout';
import { RegisterComponent } from './components/auth/register/register';
import { ForgotPasswordComponent } from './forgot-password/forgot-password';

import { ProductComponent } from './product/product';

import { ClientComponent } from './client/client';
import { AuthGuard } from './core/guards/auth.guard';
import { ProfileComponent } from './features/users/components/profile/profile';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  { path: 'login/registrar', component: RegisterComponent },
  { path: 'login/cambiar-contraseña', component: ForgotPasswordComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'compras',
        loadChildren: () => import('./features/compras/compras.routes').then((r)=>r.ComprasRoutingModule),
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/user.routes').then((r) => r.UserRoutingModule),
      },
      { path: 'clientes', component: ClientComponent },
      {
        path: 'productos',
        loadChildren: () =>
          import('./features/products/product.routes').then((r) => r.ProductsRoutingModule),
      },
      {
        path: 'proveedores',
        loadChildren: () =>
          import('./features/proveedor/proveedor.routes').then((r) => r.ProveedoresRoutingModule),
      },
      {
        path: 'faenas',
        loadChildren: () =>
          import('./features/faenas/faenas.routes').then((r) => r.FaenasRoutingModule),
      },
      {
        path: 'transporte',
        loadChildren: () =>
          import('./features/transport/transport.routes').then((r) => r.TransportRoutingModule),
      },
      {
        path: 'ventas',
        loadChildren: () =>
          import('./features/venta/venta.routes').then((r) => r.VentasRoutingModule),
      },
      {
        path: 'caja',
        loadChildren: () => import('./features/caja/caja.routes').then((r) => r.CajaRoutingModule),
      },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

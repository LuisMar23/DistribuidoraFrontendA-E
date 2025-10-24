import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { LayoutComponent } from './layout/layout';
import { RegisterComponent } from './components/auth/register/register';
import { ChangePasswordComponent } from './components/auth/change-password/change-password';

import { AuthGuard } from './core/guards/auth.guard';
import { ProfileComponent } from './features/users/components/profile/profile';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  { path: 'login/registrar', component: RegisterComponent },
  { path: 'login/cambiar-contraseña', component: ChangePasswordComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'compras',
        loadChildren: () =>
          import('./features/compras/compras.routes').then((r) => r.ComprasRoutingModule),
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./features/users/user.routes').then((r) => r.UserRoutingModule),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./features/clientes/clientes.routes').then((r) => r.ClientesRoutingModule),
      },
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
      {
        path: 'pagos',
        loadChildren: () => import('./features/pagos/pago.routes').then((r) => r.PagoRoutingModule),
      },
      {
        path:'mataderos',
        loadChildren:()=>import('./features/matadero/matadero.routes').then((r)=>r.MataderoRoutingModule)
      }
    ],
  },
  { path: '**', redirectTo: '/login' },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

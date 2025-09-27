import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { LayoutComponent } from './layout/layout';
import { RegisterComponent } from './components/auth/register/register';
import { ForgotPasswordComponent } from './forgot-password/forgot-password';
import { TransportComponent } from './transport/transport';
import { ClientComponent } from './client/client';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  { path: 'login/registrar', component: RegisterComponent },
  {path:'login/cambiar-contraseña',component:ForgotPasswordComponent},
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', 
        loadChildren:()=>import('./features/users/user.routes').then((r)=>r.UserRoutingModule)
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
      { path: 'transporte', component: TransportComponent },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

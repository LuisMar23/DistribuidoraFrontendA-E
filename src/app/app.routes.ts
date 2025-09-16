import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { LayoutComponent } from './layout/layout';
import { Register } from './components/auth/register/register';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirige a login por defecto
  { path: 'login', component: LoginComponent },
  { path: 'register', component: Register },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: DashboardComponent }, // dashboard inicial
    ],
  },
  { path: '**', redirectTo: '/login' }, // Redirige a login para rutas no encontradas
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

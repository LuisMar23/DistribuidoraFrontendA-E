import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { LayoutComponent } from './layout/layout';
import { RegisterComponent } from './components/auth/register/register';
import { UsersComponent } from './users/users';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // { path: '', component: DashboardComponent }, // prueba sin Layout
 {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      {path:'users',component:UsersComponent}
    ],
  },
  { path: '**', redirectTo: '/login' },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

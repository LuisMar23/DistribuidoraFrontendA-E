// src/matadero/matadero-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

import { MataderoCreate } from './components/matadero-create/matadero-create';
// import { MataderoEdit } from './components/matadero-edit/matadero-edit';
import { MataderoComponent } from './components/matadero-list/matadero-list';

const routes: Routes = [
  { path: '', component:MataderoComponent, canActivate: [AuthGuard] },
  { path: 'lista', component: MataderoComponent, canActivate: [AuthGuard] },
  { path: 'crear', component: MataderoCreate, canActivate: [AuthGuard] },
  // { path: 'editar/:id', component: MataderoEdit, canActivate: [AuthGuard] },
  { path: ':id', component: MataderoComponent, canActivate: [AuthGuard] }, // Para ver detalles
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MataderoRoutingModule {}

// src/matadero/matadero-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { MataderoList } from './components/matadero-list/matadero-list';
import { MataderoCreate } from './components/matadero-create/matadero-create';
import { MataderoEdit } from './components/matadero-edit/matadero-edit';

const routes: Routes = [
  { path: '', component: MataderoList, canActivate: [AuthGuard] },
  { path: 'lista', component: MataderoList, canActivate: [AuthGuard] },
  { path: 'crear', component: MataderoCreate, canActivate: [AuthGuard] },
  { path: 'editar/:id', component: MataderoEdit, canActivate: [AuthGuard] }, // Nueva ruta para editar
  { path: ':id', component: MataderoList, canActivate: [AuthGuard] }, // Para ver detalles
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MataderoRoutingModule {}

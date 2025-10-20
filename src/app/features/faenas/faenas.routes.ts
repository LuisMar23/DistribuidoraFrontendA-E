import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';

import { DetalleFaenaComponent } from './components/faena-list/faena-list';
import { DetalleFaenaFormComponent } from './components/faena-create/faena-create';

const routes: Routes = [
  { path: '', component: DetalleFaenaComponent, canActivate: [AuthGuard] },
  { path: 'crear/:id', component: DetalleFaenaFormComponent, canActivate: [AuthGuard] },
  // { path: 'editar/:id', component: DetalleFaenaFormComponent, canActivate: [AuthGuard] },
  { path: ':id', component: DetalleFaenaComponent, canActivate: [AuthGuard] },
  //   { path: 'detalle/:id', component: , canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FaenasRoutingModule {}

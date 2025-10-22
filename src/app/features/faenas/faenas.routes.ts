import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';

import { DetalleFaenaComponent } from './components/faena-list/faena-list';
import { DetalleFaenaFormComponent } from './components/faena-create/faena-create';
import { DetalleFaenaDetalleComponent } from './components/detalle-faena/detalle-faena';

const routes: Routes = [
  { path: '', component: DetalleFaenaComponent, canActivate: [AuthGuard] },
  { path: 'crear', component: DetalleFaenaFormComponent, canActivate: [AuthGuard] },
  { path: 'editar/:id', component: DetalleFaenaFormComponent, canActivate: [AuthGuard] },
  { path: 'detalle/:id', component: DetalleFaenaDetalleComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FaenasRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';
import { VentaComponent } from './components/venta-list/venta';
import { VentaCreateComponent } from './components/venta-create/venta-create';
import { VentaDetalleComponent } from './components/venta-detalle/venta-detalle';
import { VentaEditComponent } from './components/venta-edit/venta-edit';

const routes: Routes = [
  { path: '', component: VentaComponent, canActivate: [AuthGuard] },
  { path: 'crear', component: VentaCreateComponent, canActivate: [AuthGuard] },
  { path: 'detalle/:id', component: VentaDetalleComponent, canActivate: [AuthGuard] },
  { path: 'editar/:id', component: VentaEditComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VentasRoutingModule {}

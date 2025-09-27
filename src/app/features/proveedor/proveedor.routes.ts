import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';
import { ProveedorComponent } from './components/proveedor-list/proveedor';
import { ProveedorDetalle } from './components/proveedor-detalle/proveedor-detalle';

const routes: Routes = [
  { path: '', component: ProveedorComponent, canActivate: [AuthGuard] },
  {
    path: 'detalle/:id',
    component: ProveedorDetalle,
    canActivate: [AuthGuard],
    data: { renderMode: 'client' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProveedoresRoutingModule {}

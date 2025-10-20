import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

import { CompraList } from './components/compra-list/compra-list';
import { CompraGanadoComponent } from './components/compra/compra';
import { EditarCompraComponent } from './components/editar-compra/editar-compra';
import { DetalleCompra } from './components/detalle-compra/detalle-compra';

const routes: Routes = [
  { path: '', component: CompraList, canActivate: [AuthGuard] },
  { path: 'crear', component: CompraGanadoComponent, canActivate: [AuthGuard] },
  { path: 'editar/:id', component: EditarCompraComponent, canActivate: [AuthGuard] },
 { path: 'detalle/:id', component: DetalleCompra, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComprasRoutingModule {}

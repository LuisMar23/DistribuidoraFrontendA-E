import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CompraFormComponent } from './components/compra/compra';
import { CompraList } from './components/compra-list/compra-list';

const routes: Routes = [
  { path: '', component: CompraFormComponent, canActivate: [AuthGuard] },
  { path: 'lista', component: CompraList, canActivate: [AuthGuard] },
  //   { path: 'detalle/:id', component: , canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComprasRoutingModule {}

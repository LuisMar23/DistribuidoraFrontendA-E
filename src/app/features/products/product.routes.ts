// src/app/features/products/products-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ProductList } from './components/product-list/product-list';
import { ProductCreate } from './components/product-create/product-create';
import { ProductEdit } from './components/product-edit/product-edit';

const routes: Routes = [
  { path: '', component: ProductList, canActivate: [AuthGuard] },
  { path: 'lista', component: ProductList, canActivate: [AuthGuard] },
  { path: 'crear', component: ProductCreate, canActivate: [AuthGuard] },
  { path: 'editar/:id', component: ProductEdit, canActivate: [AuthGuard] },
  // Opcional: si decides usar una página de detalles en lugar del modal
  // { path: ':id', component: ProductDetail, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}

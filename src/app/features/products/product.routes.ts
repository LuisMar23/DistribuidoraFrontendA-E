import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "../../core/guards/auth.guard";
import { ProductList } from "./components/product-list/product-list";

const routes: Routes = [
  { path: '', component: ProductList, canActivate: [AuthGuard] },
//   { path: 'detalle/:id', component: ProveedorDetalle, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule {}
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "../../core/guards/auth.guard";
import { FaenaList } from "./components/faena-list/faena-list";
import { FaenaCreate } from "./components/faena-create/faena-create";

const routes: Routes = [
  { path: '', component: FaenaList, canActivate: [AuthGuard] },
  {path:'create',component:FaenaCreate,canActivate:[AuthGuard]}
//   { path: 'detalle/:id', component: , canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FaenasRoutingModule {}
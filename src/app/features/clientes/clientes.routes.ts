import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "../../core/guards/auth.guard";
import { ClientComponent } from "./components/clientes-list/clientes-list";


const routes:Routes=[
  { path: '', component:ClientComponent, canActivate: [AuthGuard] },

];

@NgModule({
    imports:[RouterModule.forChild(routes)],
    exports:[RouterModule]
})
export class ClientesRoutingModule{}
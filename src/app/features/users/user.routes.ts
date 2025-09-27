import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { UsersComponent } from "./components/user-list/users";
import { AuthGuard } from "../../core/guards/auth.guard";

const routes:Routes=[
    {path:'',component:UsersComponent,canActivate:[AuthGuard]}
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule{}
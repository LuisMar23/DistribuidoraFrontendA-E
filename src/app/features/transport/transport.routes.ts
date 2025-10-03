import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { TransportComponent } from './components/transport-list/transport';
import { TransportDetalle } from './components/transport-detalle/transport-detalle'; 

const routes: Routes = [
    { path: '', component: TransportComponent, canActivate: [AuthGuard] },
    { path: 'detalle/:id', component: TransportDetalle, canActivate: [AuthGuard] },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportRoutingModule {}

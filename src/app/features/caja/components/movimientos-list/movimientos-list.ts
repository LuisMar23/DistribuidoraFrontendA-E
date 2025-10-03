import { Component, effect, inject, Input } from '@angular/core';
import { MovimientoService } from '../../services/movimiento.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Movimiento } from '../../../../core/interfaces/caja.interface';

@Component({
  selector: 'app-movimientos-list',
  imports: [CommonModule],
  templateUrl: './movimientos-list.html',
  styleUrl: './movimientos-list.css',
})
export class MovimientosList {
  public movSvc = inject(MovimientoService);

  cajaId!:number

  ngOnInit() {
        console.log(this.cajaId);
    this.route.paramMap.subscribe((params) => {
      this.cajaId = Number(params.get('id'));
      console.log('Caja ID:', this.cajaId);
    });
     if (this.cajaId) {
      this.movSvc.loadByCaja(this.cajaId);
      this.movSvc.loadTotales(this.cajaId);
    }

  
  }
  constructor(private route: ActivatedRoute) {
    // debug signals
      effect(() => {
      console.log('Movimientos:', this.movSvc.movimientos());
      console.log('Totales:', this.movSvc.totales());
    });
  }
   get movimientosList(): Movimiento[] {
    return this.movSvc.movimientos() || [];
  }
getTotalIngresos(): number {
  return this.movSvc.movimientos()
    .filter(m => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0);
}

getTotalEgresos(): number {
  return this.movSvc.movimientos()
    .filter(m => m.tipo === 'EGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0);
}

getBalance(): number {
  return this.getTotalIngresos() - this.getTotalEgresos();
}
}

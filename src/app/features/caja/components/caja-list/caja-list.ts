import { Component, inject } from '@angular/core';
import { CajaService } from '../../services/caja.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCashRegister } from '@fortawesome/free-solid-svg-icons';
import { AppRoutingModule } from '../../../../app.routes';
import { RouterModule } from '@angular/router';
import { MovimientoModalComponent } from '../movimiento/movimiento';

@Component({
  selector: 'app-caja-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterModule,
    MovimientoModalComponent,
  ],
  templateUrl: './caja-list.html',
  styleUrl: './caja-list.css',
})
export class CajaList {
  cajaService = inject(CajaService);
  fb = inject(FormBuilder);

  faCashRegister = faCashRegister;
  
  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      montoInicial: [0, [Validators.min(0)]],
    });

    this.cajaService.cargarCajas();
  }

  crearCaja() {
    if (this.form.invalid) return;

    this.cajaService.crearCaja({
      nombre: this.form.value.nombre,
      montoInicial: this.form.value.montoInicial,
    });

    this.form.reset({ montoInicial: 0 });
  }

  abrir(id: number) {
    this.cajaService.abrirCaja(id);
  }

  cerrar(id: number) {
    this.cajaService.cerrarCaja(id);
  }

  getCajasAbiertas(): number {
    return this.cajaService.cajas().filter((c) => c.estado === 'ABIERTA').length;
  }

  getCajasCerradas(): number {
    return this.cajaService.cajas().filter((c) => c.estado === 'CERRADA').length;
  }

  getTotalCajas(): number {
    return this.cajaService.cajas().reduce((sum, c) => sum + c.saldoActual, 0);
  }

  getDiferencia(caja: any): number {
    return caja.saldoActual - caja.montoInicial;
  }
}

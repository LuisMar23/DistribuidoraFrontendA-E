import { Component, inject, Input } from '@angular/core';
import { CierreService } from '../../services/cierre.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cierre',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './cierre.html',
  styleUrl: './cierre.css'
})
export class Cierre {
  cierreService = inject(CierreService);
  fb = inject(FormBuilder);

  @Input() cajaId!: number; // se pasa desde el componente padre
  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      saldoReal: [0, [Validators.required, Validators.min(0)]],
      tipo: ['TOTAL', Validators.required],
      observaciones: [''],
    });
  }

  crearCierre() {
    if (this.form.invalid) return;

    this.cierreService.crear({
      cajaId: this.cajaId,
      saldoReal: this.form.value.saldoReal,
      tipo: this.form.value.tipo,
      observaciones: this.form.value.observaciones,
    });

    this.form.reset({ tipo: 'TOTAL', saldoReal: 0 });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovimientoService } from '../../services/movimiento.service'; // Ajusta la ruta
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { NotificationService } from '../../../../core/services/notification.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-movimiento-modal',
  standalone: true,
  imports:[FontAwesomeModule,ReactiveFormsModule,FormsModule],
  templateUrl: './movimiento.html',
})
export class MovimientoModalComponent {
  private _fb = inject(FormBuilder);

  private _notificacionService = inject(NotificationService);
  private _movimientoService = inject(MovimientoService);

  faTimes = faTimes;

  visible = signal(false);
  loading = signal(false);

  form = this._fb.group({
    cajaId: [1, Validators.required],
    usuarioId: [1],
    tipo: ['EGRESO', Validators.required],
    monto: [null, [Validators.required, Validators.min(1)]],
    descripcion: ['', Validators.required],
    metodoPago: ['EFECTIVO'],
    referencia: [''],
  });

  open() {
    this.form.get('cajaId')?.setValue(1);
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
    this.form.reset({ tipo: 'EGRESO', metodoPago: 'EFECTIVO' });
  }

  save() {
    if (this.form.invalid) return;

    this.loading.set(true);

    this._movimientoService.addMovimiento(this.form.value);
    const tipo = this.form.value.tipo === 'INGRESO' ? 'ingreso' : 'egreso';
    this._notificacionService.showSuccess(`Se registró el ${tipo} correctamente.`);
    this.loading.set(false);
    this.close();
  }
}

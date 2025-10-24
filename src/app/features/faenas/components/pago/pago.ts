import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { DetalleFaenaService } from '../../services/faena.service';
import { RegistrarPagoDto } from '../../../../core/interfaces/faena.interface';


@Component({
  selector: 'app-pago-modal',
  imports:[ReactiveFormsModule],
  templateUrl: './pago.html',
})
export class PagoModalComponent {
  @Input() faenaId!: number;
  @Input() cajaId!: number;
  @Output() pagoRegistrado = new EventEmitter<void>();
  form: FormGroup;
  file: File | null = null;

  constructor(private fb: FormBuilder, private faenaService: DetalleFaenaService) {
    this.form = this.fb.group({
      fechaPago: [new Date().toISOString().split('T')[0], Validators.required],
      formaPago: ['efectivo', Validators.required],
      referencia: [''],
      observaciones: [''],
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.file = input.files[0];
    }
  }

  registrarPago() {
    if (!this.form.valid) return;

    const dto: RegistrarPagoDto = {
      ...this.form.value,
      cajaId: this.cajaId,
    };

  this.faenaService.registrarPago(this.faenaId, dto, this.file ?? undefined).subscribe({
      next: () => {
        this.pagoRegistrado.emit();
        this.close();
      },
      error: (err) => console.error('Error registrando pago', err),
    });
  }

  close() {
    this.pagoRegistrado.emit(); // puede usarse para cerrar el modal
  }
}

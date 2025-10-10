// src/matadero/components/matadero-create/matadero-create.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MataderoService } from '../../services/matadero.service';
import { CompraService } from '../../../compras/services/compra.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Compra } from '../../../../core/interfaces/compra.interface';

@Component({
  selector: 'app-matadero-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './matadero-create.html',
  styleUrls: ['./matadero-create.css'],
})
export class MataderoCreate implements OnInit {
  mataderoForm: FormGroup;
  compras = signal<Compra[]>([]);
  registrosMatadero = signal<FormGroup[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  compraSeleccionada: Compra | null = null;

  private fb = inject(FormBuilder);
  private mataderoSvc = inject(MataderoService);
  private compraSvc = inject(CompraService);
  private notificationSvc = inject(NotificationService);
  private router = inject(Router);

  constructor() {
    this.mataderoForm = this.crearFormularioMatadero();
  }

  ngOnInit(): void {
    this.obtenerCompras();
  }

  obtenerCompras() {
    this.compraSvc.getAll(1, 100).subscribe({
      next: (resp) => {
        this.compras.set(resp.data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar compras:', err);
        this.error.set('No se pudieron cargar las compras');
        this.cargando.set(false);
      },
    });
  }

  crearFormularioMatadero(): FormGroup {
    return this.fb.group({
      sec: [''],
      odd: [''],
      est: [''],
      peso: [0, [Validators.required, Validators.min(0.01)]],
      tipoRes: ['', Validators.required],
      tipoIngreso: ['', Validators.required],
      observaciones: [''],
    });
  }

  onCompraChange(compraId: number): void {
    if (!compraId) {
      this.compraSeleccionada = null;
      this.registrosMatadero.set([]);
      return;
    }

    const compra = this.compras().find((c) => c.id === compraId);
    this.compraSeleccionada = compra || null;
    this.registrosMatadero.set([]);
  }

  agregarRegistro(): void {
    if (this.mataderoForm.valid) {
      const nuevoRegistro = this.crearFormularioMatadero();
      nuevoRegistro.patchValue(this.mataderoForm.value);
      this.registrosMatadero.update((registros) => [...registros, nuevoRegistro]);
      this.mataderoForm.reset();
    } else {
      this.mataderoForm.markAllAsTouched();
      this.notificationSvc.showError('Complete los campos del registro antes de agregar.');
    }
  }

  eliminarRegistro(index: number): void {
    this.registrosMatadero.update((registros) => {
      const nuevos = [...registros];
      nuevos.splice(index, 1);
      return nuevos;
    });
  }

  get pesoTotal(): number {
    return this.registrosMatadero().reduce((total, form) => {
      return total + (form.get('peso')?.value || 0);
    }, 0);
  }

  onSubmit(): void {
    if (!this.compraSeleccionada) {
      this.notificationSvc.showError('Seleccione una compra primero.');
      return;
    }

    if (this.registrosMatadero().length === 0) {
      this.notificationSvc.showError('Agregue al menos un registro de matadero.');
      return;
    }

    const todosValidos = this.registrosMatadero().every((form) => form.valid);
    if (!todosValidos) {
      this.notificationSvc.showError('Algunos registros tienen errores. Revise los campos.');
      return;
    }

    const observables = this.registrosMatadero().map((form) => {
      const data = {
        ...form.value,
        peso: Number(form.value.peso),
        compraId: this.compraSeleccionada!.id,
      };
      return this.mataderoSvc.create(data);
    });

    Promise.all(observables.map((obs) => obs.toPromise()))
      .then(() => {
        this.notificationSvc.showSuccess(
          `¡${observables.length} registros guardados exitosamente!`
        );
        this.router.navigate(['/mataderos/lista']);
      })
      .catch((err) => {
        console.error('Error al guardar registros:', err);
        this.notificationSvc.showError('Error al guardar los registros. Intente nuevamente.');
      });
  }

  // ✅ CORREGIDO: proveedor ya es string
  getProveedorNombre(): string {
    return this.compraSeleccionada?.proveedor || 'N/A';
  }

  getFechaCompra(): string {
    return this.compraSeleccionada?.fecha
      ? new Date(this.compraSeleccionada.fecha).toLocaleDateString('es-ES')
      : 'N/A';
  }
}

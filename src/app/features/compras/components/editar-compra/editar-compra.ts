import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CompraService } from '../../services/compra.service';
import { ReciboService } from '../../../../core/services/recibo.service';
import { CommonModule } from '@angular/common';
import { faFileUpload, faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationService } from '../../../../core/services/notification.service';
@Component({
  selector: 'app-compra-ganado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './editar-compra.html',
})
export class EditarCompraComponent implements OnInit {
  compraId!: number;
  codigo!: string;
  faFileUpload = faFileUpload;
  faSave = faSave;
  compraForm = signal<FormGroup | null>(null);
  detalles = signal<any[]>([]);
  recibos = signal<any[]>([]);
  archivosSeleccionados = signal<File[]>([]);
  cargando = signal(false);

  private compraService = inject(CompraService);
  private reciboService = inject(ReciboService);
  private notificacionService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  detallesArray = computed(() => {
    const form = this.compraForm();
    return form ? (form.get('detalles') as FormArray) : null;
  });

  ngOnInit(): void {
    this.compraId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.cargarCompra();
  }

  initForm() {
    this.compraForm.set(
      this.fb.group({
        observaciones: [''],
        otrosGastos: [0, Validators.min(0)],
        transportes: [0, Validators.min(0)],
        detalles: this.fb.array([]),
      })
    );
  }

  cargarCompra() {
    this.cargando.set(true);
    this.compraService.getById(this.compraId).subscribe({
      next: (compra) => {
        this.codigo = compra.codigo;
        const detallesFG = compra.detalles.map((d: any) => {
          const group = this.fb.group({
            id: [d.id],
            pesoNeto: [d.pesoNeto, [Validators.required, Validators.min(0)]],
            pesoBruto: [d.pesoBruto, [Validators.required, Validators.min(0)]],
            precio: [d.precio, [Validators.required, Validators.min(0)]],
            cantidad: [d.cantidad, [Validators.required, Validators.min(1)]],
            precioTotal: [{ value: d.precioTotal, disabled: true }],
          });
          group.get('pesoNeto')?.valueChanges.subscribe(() => this.calcularPrecioTotal(group));
          group.get('precio')?.valueChanges.subscribe(() => this.calcularPrecioTotal(group));
          group.get('cantidad')?.valueChanges.subscribe(() => this.calcularPrecioTotal(group));

          return group;
        });

        this.compraForm.set(
          this.fb.group({
            observaciones: [compra.observaciones],
            otrosGastos: [compra.otrosGastos, Validators.min(0)],
            transportes: [compra.transportes, Validators.min(0)],
            detalles: this.fb.array(detallesFG),
          })
        );

        this.compraForm()
          ?.get('otrosGastos')
          ?.valueChanges.subscribe(() => {
            this.recalcularTodosLosDetalles();
          });

        this.compraForm()
          ?.get('transportes')
          ?.valueChanges.subscribe(() => {
            this.recalcularTodosLosDetalles();
          });

        this.detalles.set(compra.detalles);
        this.recibos.set(compra.recibos || []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
      },
    });
  }
  recalcularTodosLosDetalles() {
    const detallesArray = this.detallesArray();
    if (detallesArray) {
      detallesArray.controls.forEach((control) => {
        this.calcularPrecioTotal(control as FormGroup);
      });
    }
  }
  calcularPrecioTotal(detalleGroup: FormGroup) {
    const pesoNeto = detalleGroup.get('pesoNeto')?.value || 0;
    const precio = detalleGroup.get('precio')?.value || 0;
    const otrosGastos = Number(this.compraForm()?.get('otrosGastos')?.value) || 0;
    const transportes = Number(this.compraForm()?.get('transportes')?.value) || 0;

    const total = pesoNeto * precio + otrosGastos + transportes;

    detalleGroup.get('precioTotal')?.setValue(total.toFixed(2), { emitEvent: false });
  }

  onArchivoSeleccionado(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.archivosSeleccionados.set(Array.from(files));
    }
  }

  subirRecibos() {
    const archivos = this.archivosSeleccionados();
    if (!archivos.length) return;

    this.cargando.set(true);
    const dto = {
      tipoOperacion: 'compra' as const,
      compraId: this.compraId,
    };

 this.reciboService.subirArchivos(archivos, dto).subscribe({
  next: (res: any | any[]) => {
    // 🔹 Normalizamos res para que siempre sea un array
    const archivosSubidos = Array.isArray(res) ? res : [res];

    // 🔹 Actualizamos la señal
    this.recibos.set([...this.recibos(), ...archivosSubidos]);

    // 🔹 Limpiar input y estados
    this.archivosSeleccionados.set([]);
    this.limpiarInputFile();
    this.cargando.set(false);

    // 🔹 Notificación
    this.notificacionService.showSuccess(`✅ ${archivosSubidos.length} archivo(s) subido(s) exitosamente`);
  },
  error: (err) => {
    this.notificacionService.showError('❌ Error al subir los archivos');
    this.cargando.set(false);
  },
});

  }

  private limpiarInputFile() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  eliminarRecibo(reciboId: number) {
    this.notificacionService
      .confirmDelete('¿Está seguro de eliminar este recibo?')
      .then((result) => {
        if (result.isConfirmed) {
          this.notificacionService.showSuccess('Eliminado correctamente');
          this.reciboService
            .eliminar(reciboId)
            .subscribe(() => this.recibos.set(this.recibos().filter((r) => r.id !== reciboId)));
        }
      });
  }

  guardar() {
    const form = this.compraForm();
    if (!form || form.invalid) {
      this.notificacionService.showAlert('Por favor complete todos los campos requeridos');

      return;
    }

    const detallesArray = this.detallesArray();
    if (!detallesArray || detallesArray.length === 0) {
      this.notificacionService.showAlert('Debe haber al menos un detalle');
      return;
    }
    const detallesValue = detallesArray.controls.map((control) => {
      const group = control as FormGroup;
      return {
        id: group.get('id')?.value,
        pesoNeto: group.get('pesoNeto')?.value,
        pesoBruto: group.get('pesoBruto')?.value,
        precio: group.get('precio')?.value,
        cantidad: group.get('cantidad')?.value,
        precioTotal: group.get('precioTotal')?.value,
      };
    });

    const payload = {
      observaciones: form.get('observaciones')?.value,
      otrosGastos: form.get('otrosGastos')?.value,
      transportes: form.get('transportes')?.value,
      detalles: detallesValue,
    };

    this.compraService.update(this.compraId, payload).subscribe({
      next: () => {
        this.notificacionService.showSuccess('Compra actualizada exitosamente');

        this.router.navigate(['/compras']);
      },
      error: (err) => {
        this.notificacionService.showError('Error al guardar la compra');
      },
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MataderoService } from '../../services/matadero.service';
import { CompraService } from '../../../compras/services/compra.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-matadero-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './matadero-create.html',
})
export class MataderoCreate implements OnInit {
  mataderoForm: FormGroup;
  compras = signal<any[]>([]);
  registrosMatadero = signal<FormGroup[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  compraSeleccionada: any = null;
  compraIdSeleccionada: number | null = null;
  enviando = signal<boolean>(false);

  private fb = inject(FormBuilder);
  private mataderoSvc = inject(MataderoService);
  private compraSvc = inject(CompraService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  constructor() {
    this.mataderoForm = this.crearFormularioMatadero();
  }

  ngOnInit(): void {
    this.probarConexion();
    this.obtenerCompras();
  }

  probarConexion() {
    this.mataderoSvc.testConnection().subscribe({
      next: (response) => {
        console.log('Conexión con backend exitosa:', response);
      },
      error: (error) => {
        console.error('Error de conexión con backend:', error);
        this.error.set('No se pudo conectar con el servidor');
      },
    });
  }

  obtenerCompras() {
    this.cargando.set(true);
    this.compraSvc.getAll(1, 100).subscribe({
      next: (resp) => {
        console.log('Compras recibidas:', resp);
        if (resp && resp.data) {
          this.compras.set(resp.data);
          console.log('Compras cargadas:', resp.data.length);
        } else {
          this.compras.set([]);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar compras:', err);
        this.error.set(
          'No se pudieron cargar las compras: ' + (err.message || 'Error desconocido')
        );
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

  onCompraChange(compraId: string): void {
    console.log('Compra seleccionada ID:', compraId);

    this.compraIdSeleccionada = compraId ? Number(compraId) : null;

    if (!this.compraIdSeleccionada) {
      this.compraSeleccionada = null;
      this.registrosMatadero.set([]);
      return;
    }

    const compra = this.compras().find((c) => c.id === this.compraIdSeleccionada);
    console.log('Compra encontrada:', compra);

    this.compraSeleccionada = compra || null;
    this.registrosMatadero.set([]);
  }

  agregarRegistro(): void {
    if (this.mataderoForm.valid) {
      const nuevoRegistro = this.crearFormularioMatadero();
      nuevoRegistro.patchValue(this.mataderoForm.value);
      this.registrosMatadero.update((registros) => [...registros, nuevoRegistro]);
      this.mataderoForm.reset();
      this.notificationService.showSuccess('Registro agregado correctamente');
    } else {
      this.mataderoForm.markAllAsTouched();
      this.notificationService.showError('Complete los campos del registro antes de agregar.');
    }
  }

  eliminarRegistro(index: number): void {
    this.registrosMatadero.update((registros) => {
      const nuevos = [...registros];
      nuevos.splice(index, 1);
      return nuevos;
    });
    this.notificationService.showSuccess('Registro eliminado correctamente');
  }

  get pesoTotal(): number {
    return this.registrosMatadero().reduce((total, form) => {
      return total + (form.get('peso')?.value || 0);
    }, 0);
  }

  onSubmit(): void {
    if (!this.compraSeleccionada) {
      this.notificationService.showError('Seleccione una compra primero.');
      return;
    }

    if (this.registrosMatadero().length === 0) {
      this.notificationService.showError('Agregue al menos un registro de matadero.');
      return;
    }

    const todosValidos = this.registrosMatadero().every((form) => form.valid);
    if (!todosValidos) {
      this.notificationService.showError('Algunos registros tienen errores. Revise los campos.');
      return;
    }

    this.enviando.set(true);

    const observables = this.registrosMatadero().map((form) => {
      const data = {
        ...form.value,
        peso: Number(form.value.peso),
        compraId: this.compraSeleccionada.id,
      };
      console.log('Enviando registro:', data);
      return this.mataderoSvc.create(data);
    });

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(observables).subscribe({
        next: (results) => {
          console.log('Registros guardados exitosamente:', results);
          this.enviando.set(false);
          this.notificationService.showSuccess(
            `${observables.length} registros guardados exitosamente!`
          );

          setTimeout(() => {
            this.router.navigate(['/mataderos/lista']);
          }, 1000);
        },
        error: (err) => {
          console.error('Error al guardar registros:', err);
          this.enviando.set(false);
          this.notificationService.showError(
            'Error al guardar los registros: ' +
              (err.error?.message || err.message || 'Error desconocido')
          );
        },
      });
    });
  }

  getProveedorNombre(): string {
    if (!this.compraSeleccionada) return 'N/A';
    const proveedor = this.compraSeleccionada.proveedor;
    if (!proveedor) return 'N/A';
    if (typeof proveedor === 'object') {
      return proveedor.nombre || proveedor.razonSocial || proveedor.nombreComercial || 'Proveedor';
    }
    return proveedor;
  }

  getFechaCompra(): string {
    if (!this.compraSeleccionada) return 'N/A';
    const fecha = this.compraSeleccionada.creado_en;
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  }

  getCompraDisplayText(compra: any): string {
    if (!compra) return '';
    const proveedorText = this.getProveedorDisplayText(compra.proveedor);
    const fechaText = this.getFechaDisplayText(compra);
    return `${compra.codigo} - ${proveedorText} (${fechaText})`;
  }

  getProveedorDisplayText(proveedor: any): string {
    if (!proveedor) return 'N/A';
    if (typeof proveedor === 'object') {
      return proveedor.nombre || proveedor.razonSocial || proveedor.nombreComercial || 'Proveedor';
    }
    return proveedor;
  }

  getFechaDisplayText(compra: any): string {
    if (!compra) return 'N/A';
    const fecha = compra.creado_en;
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch {
      return 'N/A';
    }
  }
}

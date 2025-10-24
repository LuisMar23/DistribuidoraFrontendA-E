import { Component, OnInit, signal, effect, inject, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DetalleFaenaService } from '../../services/faena.service';
import { CompraService } from '../../../compras/services/compra.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalle-faena-form',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './faena-create.html',
})
export class DetalleFaenaFormComponent implements OnInit {
  form!: FormGroup;
  compras = signal<any[]>([]);
  filteredCompras = signal<any[]>([]);
  searchCompra = signal('');
  isEditing = signal(false);
  compraSelected = signal(false);
  faenaId: number | null = null;
  private detalleFaenaService = inject(DetalleFaenaService);
  private compraService = inject(CompraService);
  private _notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router) {
    effect(() => {
      const term = this.searchCompra().toLowerCase();
      // No mostrar resultados si ya se seleccionó una compra
      if (this.compraSelected()) {
        this.filteredCompras.set([]);
        return;
      }

      if (term) {
        this.filteredCompras.set(
          this.compras().filter((c) => {
            const codigo = c.codigo.toLowerCase();
            const fecha = this.formatDate(c.fechaCompra);
            return codigo.includes(term) || fecha.includes(term);
          })
        );
      } else {
        this.filteredCompras.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      propiedad: ['', Validators.required],
      numeroReses: [0, [Validators.required, Validators.min(1)]],
      precioDevolucion: [0, Validators.required],
      totalDevolucion: [0, Validators.required],
      transporte: [0],
      otrosGastos: [0],
      saldoDepositar: [0, Validators.required],
      compraId: [null, Validators.required],
    });

    this.loadCompras();
    this.form.get('totalDevolucion')?.valueChanges.subscribe(() => this.calculateSaldo());
    this.form.get('transporte')?.valueChanges.subscribe(() => this.calculateSaldo());
    this.form.get('otrosGastos')?.valueChanges.subscribe(() => this.calculateSaldo());
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam && !isNaN(+idParam)) {
      // Solo si hay un id válido
      this.faenaId = +idParam;
      this.isEditing.set(true);
      this.loadDetalle(this.faenaId);
    } else {
      this.isEditing.set(false);
    }
  }

  loadCompras() {
    this.compraService.getAll().subscribe({
      next: (res) => this.compras.set(res.data || res),
      error: (err) => console.error(err),
    });
  }

  setupSaldoCalculation() {
    // Escuchar cambios en totalDevolucion, transporte y otrosGastos
    this.form.get('totalDevolucion')?.valueChanges.subscribe(() => this.calculateSaldo());
    this.form.get('transporte')?.valueChanges.subscribe(() => this.calculateSaldo());
    this.form.get('otrosGastos')?.valueChanges.subscribe(() => this.calculateSaldo());
  }

  calculateSaldo() {
    const totalDevolucion = Number(this.form.get('totalDevolucion')?.value) || 0;
    const transporte = Number(this.form.get('transporte')?.value) || 0;
    const otrosGastos = Number(this.form.get('otrosGastos')?.value) || 0;

    const saldo = totalDevolucion - transporte - otrosGastos;

    this.form.get('saldoDepositar')?.setValue(saldo, { emitEvent: false });
  }

  loadDetalle(id: number) {
    this.detalleFaenaService.getById(id).subscribe({
      next: (res) => {
        this.form.patchValue({
          fecha:
            typeof res.fecha === 'string'
              ? res.fecha.split('T')[0]
              : res.fecha.toISOString().split('T')[0],
          propiedad: res.propiedad,
          numeroReses: res.numeroReses,
          precioDevolucion: res.precioDevolucion,
          totalDevolucion: res.totalDevolucion,
          transporte: res.transporte ?? 0,
          otrosGastos: res.otrosGastos ?? 0,
          saldoDepositar: res.saldoDepositar,
          compraId: res.compra?.id,
        });

        this.searchCompra.set(res.compra?.codigo || '');
      },
      error: (err) => console.error(err),
    });
  }

  formatDate(fecha: any): string {
    if (!fecha) return '';

    try {
      if (typeof fecha === 'string') {
        if (fecha.includes('T')) {
          return fecha.split('T')[0];
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          return fecha;
        }
      }

      const date = new Date(fecha);

      if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', fecha);
        return '';
      }
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '';
    }
  }

  selectCompra(compra: any) {
    console.log('Compra seleccionada:', compra);
    console.log('Fecha original:', compra.fechaCompra);

    const fechaCompra = this.formatDate(compra.fechaCompra);
    console.log('Fecha formateada:', fechaCompra);

    this.compraSelected.set(true);
    this.filteredCompras.set([]);

    this.searchCompra.set(compra.codigo);

    this.form.patchValue({
      compraId: compra.id,
      fecha: fechaCompra,
    });

    setTimeout(() => {
      this.form.get('fecha')?.setValue(fechaCompra, { emitEvent: true });
      this.form.get('fecha')?.updateValueAndValidity();
      this.cdr.markForCheck();
    }, 0);

    console.log('Valor del formulario después de asignar:', this.form.value);
    console.log('Valor del control fecha:', this.form.get('fecha')?.value);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.form.get('saldoDepositar')?.enable();

    const dto = this.form.value;

    if (this.isEditing()) {
      this.detalleFaenaService.update(this.faenaId!, dto).subscribe({
        next: () => {
          this._notificationService.showSuccess('Detalle de faena actualizado correctamente');
          this.router.navigate(['/faenas']);
        },
        error: (err) => {
          this.form.get('saldoDepositar')?.disable();
        },
      });
    } else {
      this.detalleFaenaService.create(dto).subscribe({
        next: () => {
          this._notificationService.showSuccess('Detalle de faena creado correctamente');
          this.router.navigate(['/faenas']);
        },
        error: (err) => {
          this.form.get('saldoDepositar')?.disable();
        },
      });
    }
  }
}

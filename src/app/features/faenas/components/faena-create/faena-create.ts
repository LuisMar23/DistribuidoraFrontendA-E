import { Component, OnInit, signal, effect, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DetalleFaenaService } from '../../services/faena.service';
import { CompraService } from '../../../compras/services/compra.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-detalle-faena-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './faena-create.html',
})
export class DetalleFaenaFormComponent implements OnInit {
  form!: FormGroup;
  compras = signal<any[]>([]);
  filteredCompras = signal<any[]>([]);
  searchCompra = signal('');
  isEditing = signal(false);
  faenaId: number | null = null;
   private detalleFaenaService=inject(DetalleFaenaService)
    private compraService=inject(CompraService)
    private _notificationService=inject(NotificationService)
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {

    effect(() => {
      const term = this.searchCompra().toLowerCase();
      if (term) {
        this.filteredCompras.set(
          this.compras().filter((c) => c.codigo.toLowerCase().includes(term))
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

    // Detectar si hay un id para edición
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.faenaId = +idParam;
      this.isEditing.set(true);
      this.loadDetalle(this.faenaId);
    }



  }

  loadCompras() {
    this.compraService.getAll().subscribe({
      next: (res) => this.compras.set(res.data || res),
      error: (err) => console.error(err),
    });
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

  selectCompra(compra: any) {
    this.form.patchValue({ compraId: compra.id });
    this.searchCompra.set(compra.codigo);
    this.filteredCompras.set([]);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.form.value;

    if (this.isEditing()) {
      this.detalleFaenaService.update(this.faenaId!, dto).subscribe({
        next: () => {

          this._notificationService.showSuccess('Detalle de faena actualizado correctamente')
    
          this.router.navigate(['/detalle-faena']);
        },
        error: (err) => console.error(err),
      });
    } else {
      this.detalleFaenaService.create(dto).subscribe({
        next: () => {
          this._notificationService.showSuccess('Detalle de faena creado correctamente')
          this.router.navigate(['/detalle-faena']);
        },
        error: (err) => console.error(err),
      });
    }
  }
}

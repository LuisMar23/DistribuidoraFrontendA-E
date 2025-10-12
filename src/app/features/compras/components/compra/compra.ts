import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { ProveedorService } from '../../../proveedor/services/proveedor.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Router, RouterModule } from '@angular/router';
import { ProveedorDto } from '../../../../core/interfaces/suplier.interface';
import {
  CompraService,
  CreateCompraDto,
  CreateCompraResponse,
} from '../../services/compra.service';

@Component({
  selector: 'app-compra-ganado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './compra.html',
})
export class CompraGanadoComponent implements OnInit {
  compraForm: FormGroup;
  proveedores: ProveedorDto[] = [];
  enviando: boolean = false;

  private _proveedorService = inject(ProveedorService);
  private _notificationService = inject(NotificationService);
  private _compraService = inject(CompraService);
  private _router = inject(Router);

  constructor(private fb: FormBuilder) {
    this.compraForm = this.fb.group({
      proveedorId: ['', [Validators.required, Validators.min(1)]],
      observaciones: [''],
      otrosGastos: [0, [Validators.min(0)]],
      detalle: this.fb.group({
        cantidad: [0, [Validators.required, Validators.min(1)]],
        pesoBruto: [0, [Validators.required, Validators.min(0)]],
        pesoNeto: [0, [Validators.required, Validators.min(0)]],
        precio: [0, [Validators.required, Validators.min(0)]],
        precioTotal: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      }),
      transportes: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.obtenerProveedores();
  }

  get detalle(): FormGroup {
    return this.compraForm.get('detalle') as FormGroup;
  }

  get transportes(): FormArray {
    return this.compraForm.get('transportes') as FormArray;
  }

  calcularPrecioTotal(): void {
    const cantidad = Number(this.detalle.get('cantidad')?.value) || 0;
    const pesoNeto = Number(this.detalle.get('pesoNeto')?.value) || 0;
    const precio = Number(this.detalle.get('precio')?.value) || 0;

    const precioTotal = pesoNeto * precio;
    this.detalle.get('precioTotal')?.setValue(precioTotal, { emitEvent: false });
  }

  addTransporte(): void {
    const transporteGroup = this.fb.group({
      tipo: ['', Validators.required],
      descripcion: [''],
      costo: [0, [Validators.required, Validators.min(0)]],
      observaciones: [''],
    });
    this.transportes.push(transporteGroup);
  }

  removeTransporte(index: number): void {
    this.transportes.removeAt(index);
    this.calcularTotal();
  }

  calcularTotalTransporte(): number {
    return this.transportes.controls.reduce((sum, control) => {
      return sum + (Number(control.get('costo')?.value) || 0);
    }, 0);
  }

  calcularTotal(): number {
    const subtotal = Number(this.detalle.get('precioTotal')?.value) || 0;
    const totalTransportes = this.calcularTotalTransporte();
    const otrosGastos = Number(this.compraForm.get('otrosGastos')?.value) || 0;
    return subtotal + totalTransportes + otrosGastos;
  }

  onSubmit(): void {
    if (this.compraForm.valid) {
      this.enviando = true;

      const formData: CreateCompraDto = {
        proveedorId: Number(this.compraForm.value.proveedorId),
        usuarioId: 1,
        observaciones: this.compraForm.value.observaciones || '',
        otrosGastos: Number(this.compraForm.value.otrosGastos) || 0,
        detalles: [
          {
            cantidad: Number(this.detalle.get('cantidad')?.value),
            pesoBruto: Number(this.detalle.get('pesoBruto')?.value),
            pesoNeto: Number(this.detalle.get('pesoNeto')?.value),
            precio: Number(this.detalle.get('precio')?.value),
            precioTotal: Number(this.detalle.get('precioTotal')?.value),
          },
        ],
        transportes: this.compraForm.value.transportes
          ? this.compraForm.value.transportes.map((t: any) => ({
              tipo: t.tipo,
              descripcion: t.descripcion || '',
              costo: Number(t.costo),
              observaciones: t.observaciones || '',
            }))
          : [],
      };

      console.log('Enviando datos de compra:', formData);

      this._compraService.create(formData).subscribe({
        next: (response: CreateCompraResponse) => {
          console.log('Compra registrada exitosamente:', response);
          this._notificationService.showSuccess(
            response.message || '¡Compra registrada exitosamente!'
          );
          this.enviando = false;

          setTimeout(() => {
            this._router.navigate(['/compras/lista']);
          }, 1000);
        },
        error: (error) => {
          console.error('Error al registrar compra:', error);

          if (error.status === 401) {
            this._notificationService.showError(
              'Sesión expirada. Por favor, inicie sesión nuevamente.'
            );
          } else {
            this._notificationService.showError(
              error.error?.message || 'Error al registrar la compra. Por favor, intente nuevamente.'
            );
          }

          this.enviando = false;
        },
        complete: () => {
          this.enviando = false;
        },
      });
    } else {
      this.marcarControlesComoTocados(this.compraForm);
      this._notificationService.showError(
        'Por favor complete todos los campos requeridos correctamente.'
      );
    }
  }

  private marcarControlesComoTocados(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.marcarControlesComoTocados(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  obtenerProveedores() {
    this._proveedorService.getAll().subscribe({
      next: (resp) => {
        console.log('Proveedores cargados:', resp.data);
        this.proveedores = resp.data || [];
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
        this._notificationService.showError('Error al cargar los proveedores');
      },
    });
  }

  validarNumero(control: AbstractControl): void {
    const value = control.value;
    if (value && isNaN(value)) {
      control.setValue(0);
    }
  }
}

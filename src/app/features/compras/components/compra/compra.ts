// compra-ganado.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProveedorService } from '../../../proveedor/services/proveedor.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AppRoutingModule } from '../../../../app.routes';
import { RouterModule } from '@angular/router';
import { ProveedorDto } from '../../../../core/interfaces/suplier.interface';
import { CompraService } from '../../services/compra.service';

@Component({
  selector: 'app-compra-ganado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './compra.html',
})
export class CompraGanadoComponent implements OnInit {
  compraForm: FormGroup;
  proveedores: ProveedorDto[] = [];

  private _proveedorService = inject(ProveedorService);
  private _notificationService = inject(NotificationService);
  private _compraService = inject(CompraService);

  constructor(private fb: FormBuilder) {
    this.compraForm = this.fb.group({
      proveedorId: [0, Validators.required],
      observaciones: [''],
      otrosGastos: [0, [Validators.min(0)]],
      detalle: this.fb.group({
        cantidad: [1, [Validators.required, Validators.min(1)]],
        pesoBruto: [0, [Validators.required, Validators.min(0)]],
        pesoNeto: [0, [Validators.required, Validators.min(0)]],
        precio: [0, [Validators.required, Validators.min(0)]],
        precioTotal: [0, [Validators.required, Validators.min(0)]],
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
    const precio = Number(this.detalle.get('precio')?.value) || 0;
    const pesoNeto = Number(this.detalle.get('pesoNeto')?.value) || 0;
    const otrosGastos = Number(this.detalle.get('otrosGastos')?.value) || 0;
    const precioTotal = pesoNeto * precio;
    const total = otrosGastos + precioTotal;

    this.detalle.get('precioTotal')?.setValue(total, { emitEvent: false });
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
  }

  calcularTotalTransporte(): number {
    return this.transportes.controls.reduce((sum, control) => {
      return sum + (Number(control.get('costo')?.value) || 0);
    }, 0);
  }

  calcularTotal(): number {
    const subtotal = Number(this.detalle.get('precioTotal')?.value) || 0;
    const totalTransportes = this.calcularTotalTransporte();
    return subtotal + totalTransportes;
  }

  onSubmit(): void {
    if (this.compraForm.valid) {
      const formData = {
        proveedorId: Number(this.compraForm.value.proveedorId),
        observaciones: this.compraForm.value.observaciones,
        otrosGastos: this.compraForm.value.otrosGastos,
        detalles: [this.compraForm.value.detalle],
        transportes: this.compraForm.value.transportes,
      };

      console.log('Datos de la compra:', formData);
      this._compraService.create(formData).subscribe({
        next: () => {
          this._notificationService.showSuccess('¡Compra registrada exitosamente!');
        },
      });
    } else {
      this.compraForm.markAllAsTouched();
      this._notificationService.showError('Por favor complete todos los campos requeridos.');
    }
  }

  // cancelar(): void {
  //   if (confirm('¿Está seguro que desea cancelar? Se perderán todos los datos ingresados.')) {
  //     this.compraForm.reset({
  //       proveedorId: '',
  //       observaciones: '',
  //       detalle: {
  //         cantidad: 1,
  //         pesoBruto: 0,
  //         pesoNeto: 0,
  //         precio: 0,
  //         precioTotal: 0,
  //       },
  //     });
  //     this.transportes.clear();
  //   }
  // }

  obtenerProveedores() {
    this._proveedorService.getAll().subscribe({
      next: (resp) => {
        console.log(resp.data);
        this.proveedores = resp.data;
      },
    });
  }
}

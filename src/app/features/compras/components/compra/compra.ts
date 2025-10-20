import { Component, HostListener, inject, OnInit } from '@angular/core';
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
  proveedoresFiltrados: ProveedorDto[] = [];
  proveedorSeleccionado: any = null;
  proveedorBusqueda: string = '';
  mostrarLista = false;
  enviando = false;

  private _proveedorService = inject(ProveedorService);
  private _notificationService = inject(NotificationService);
  private _compraService = inject(CompraService);
  private _router = inject(Router);

  constructor(private fb: FormBuilder) {
    this.compraForm = this.fb.group({
      proveedorId: ['', [Validators.required]],
      observaciones: [''],
      otrosGastos: [0, [Validators.min(0)]],
      transportes: [0, [Validators.min(0)]],
      detalle: this.fb.group({
        cantidad: [, [Validators.required, Validators.min(1)]],
        pesoBruto: [, [Validators.required, Validators.min(0)]],
        pesoNeto: [, [Validators.required, Validators.min(0)]],
        precio: [, [Validators.required, Validators.min(0)]],
        precioTotal: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      }),
    });
  }

  ngOnInit(): void {
    this.obtenerProveedores();
  }


  get detalle(): FormGroup {
    return this.compraForm.get('detalle') as FormGroup;
  }


  calcularPrecioTotal(): void {
    const pesoNeto = Number(this.detalle.get('pesoNeto')?.value) || 0;
    const precio = Number(this.detalle.get('precio')?.value) || 0;
    const precioTotal = pesoNeto * precio;
    this.detalle.get('precioTotal')?.setValue(precioTotal, { emitEvent: false });
  }

  calcularTotal(): number {
    const subtotal = Number(this.detalle.get('precioTotal')?.value) || 0;
    const transporte = Number(this.compraForm.get('transportes')?.value) || 0;
    const otrosGastos = Number(this.compraForm.get('otrosGastos')?.value) || 0;
    return subtotal + transporte + otrosGastos;
  }

  onSubmit(): void {
    if (this.compraForm.invalid) {
      this.marcarControlesComoTocados(this.compraForm);
      this._notificationService.showError(
        'Por favor complete todos los campos requeridos correctamente.'
      );
      return;
    }

    this.enviando = true;

    const formData: CreateCompraDto = {
      proveedorId: Number(this.compraForm.value.proveedorId),
      observaciones: this.compraForm.value.observaciones || '',
      otrosGastos: Number(this.compraForm.value.otrosGastos) || 0,
      transportes: Number(this.compraForm.value.transportes) || 0,
      detalles: [
        {
          cantidad: Number(this.detalle.get('cantidad')?.value),
          pesoBruto: Number(this.detalle.get('pesoBruto')?.value),
          pesoNeto: Number(this.detalle.get('pesoNeto')?.value),
          precio: Number(this.detalle.get('precio')?.value),
          precioTotal: Number(this.detalle.get('precioTotal')?.value),
        },
      ],
    };


    this._compraService.create(formData).subscribe({
      next: (response: CreateCompraResponse) => {
        console.log('Compra registrada exitosamente:', response);
        this._notificationService.showSuccess(
          response.message || '¡Compra registrada exitosamente!'
        );
        this.enviando = false;
        setTimeout(() => {
          this._router.navigate(['/compras']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error al registrar compra:', error);
        this._notificationService.showError(
          error.error?.message || 'Error al registrar la compra. Por favor, intente nuevamente.'
        );
        this.enviando = false;
      },
    });
  }

  obtenerProveedores() {
    this._proveedorService.getAll().subscribe({
      next: (resp) => {
        this.proveedores = resp.data;
        this.proveedoresFiltrados = this.proveedores;
      },
      error: (error) => {
        this._notificationService.showError(`Error al cargar los proveedores ${error}`);
      },
    });
  }

  filtrarProveedores(event: Event) {
    const valor = (event.target as HTMLInputElement).value.toLowerCase();
    this.proveedorBusqueda = valor;
    this.proveedoresFiltrados = this.proveedores.filter((p) =>
      p.persona.nombre.toLowerCase().includes(valor)
    );
  }

  seleccionarProveedor(proveedor: any) {
    this.proveedorSeleccionado = proveedor;
    this.compraForm.patchValue({ proveedorId: proveedor.id_proveedor });
    this.proveedorBusqueda = proveedor.persona.nombre;
    this.mostrarLista = false;
  }

  private marcarControlesComoTocados(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.marcarControlesComoTocados(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  validarNumero(control: AbstractControl): void {
    const value = control.value;
    if (value && isNaN(value)) {
      control.setValue(0);
    }
  }

  @HostListener('document:click', ['$event'])
  clickFuera(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.mostrarLista = false;
    }
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CompraService } from '../../services/compra.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDollar, faList, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { AppRoutingModule } from '../../../../app.routes';
import { RouterModule } from '@angular/router';
import { ProveedorService } from '../../../proveedor/services/proveedor.service';
import { ProveedorDto } from '../../../../core/interfaces/suplier.interface';

@Component({
  selector: 'app-compra-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './compra.html',
})
export class CompraFormComponent {
  compraForm!: FormGroup;
  faShopingCart = faShoppingCart;
  faList = faList;
  faDollar=faDollar

  proveedores = signal<ProveedorDto[]>([]);
  resultados = signal<ProveedorDto[]>([]);
  private compraService = inject(CompraService);
  private proveedorSvc = inject(ProveedorService);
  private fb = inject(FormBuilder);

  busqueda = signal<string>('');
  mostrarResultados = signal<boolean>(false);

  constructor() {}

  ngOnInit() {
    this.compraForm = this.fb.group({
      proveedorId: [null, Validators.required],
      precioTotal: [{ value: 0, disabled: true }],
      estado: ['pendiente'],
      observaciones: [''],
      faenas: this.fb.array([]),
    });

    // iniciar con una faena por defecto
    this.addFaena();
    this.getAllProveedores();
  }

  faenas(): FormArray {
    return this.compraForm.get('faenas') as FormArray;
  }

  addFaena() {
    const faena = this.fb.group({
      propiedad: ['', Validators.required],
      tipoGanado: ['', Validators.required],
      tipoIngreso: ['', Validators.required],
      otrosGastos: [0],
      saldoDepositar: [0],
      pesoBruto: [{ value: 0, disabled: true }],
      pesoNeto: [{ value: 0, disabled: true }],
      precioTotal: [{ value: 0, disabled: true }],
      transportes: this.fb.array([]),
      reses: this.fb.array([]),
    });

    // Primero agregamos la faena al FormArray
    this.faenas().push(faena);
    const faenaIndex = this.faenas().length - 1;

    // Escuchar cambios en otrosGastos
    faena.get('otrosGastos')?.valueChanges.subscribe(() => {
      this.calcularFaena(faenaIndex);
    });

    // Agregar reses automáticamente
    this.addRes(faenaIndex);
  }

  removeFaena(index: number) {
    this.faenas().removeAt(index);
    this.calcularTotalCompra();
  }

  // ===== RESES =====
  reses(faenaIndex: number): FormArray {
    return this.faenas().at(faenaIndex).get('reses') as FormArray;
  }

  addRes(faenaIndex: number) {
    const res = this.fb.group({
      numero: [this.reses(faenaIndex).length + 1],
      partes: this.fb.array([]),
    });

    // agregar partes A y B automáticamente
    ['A', 'B'].forEach((nombre) => {
      if (!res.get('partes')) {
        res.setControl('partes', this.fb.array([]));
      }
      const partesArray = res.get('partes') as FormArray;

      partesArray.push(
        this.fb.group({
          nombre,
          pesoNeto: [0, Validators.required],
          precioUnit: [0, Validators.required],
          observaciones: [''],
        })
      );

      // recalcular precio total y pesos al cambiar pesoNeto o precioUnit
      partesArray.at(partesArray.length - 1).valueChanges.subscribe(() => {
        this.calcularFaena(faenaIndex);
      });
    });

    this.reses(faenaIndex).push(res);
    this.calcularFaena(faenaIndex);
  }

  removeRes(faenaIndex: number, resIndex: number) {
    this.reses(faenaIndex).removeAt(resIndex);
    this.calcularFaena(faenaIndex);
  }

  // ===== PARTES =====
  partes(faenaIndex: number, resIndex: number): FormArray {
    return this.reses(faenaIndex).at(resIndex).get('partes') as FormArray;
  }

  // ===== TRANSPORTES =====
  transportes(faenaIndex: number): FormArray {
    return this.faenas().at(faenaIndex).get('transportes') as FormArray;
  }

  addTransporte(faenaIndex: number) {
    const transporte = this.fb.group({
      tipo: ['', Validators.required],
      descripcion: [''],
      costo: [0, Validators.required],
      observaciones: [''],
    });

    // escuchar cambios en costo para recalcular
    transporte.get('costo')?.valueChanges.subscribe(() => {
      this.calcularFaena(faenaIndex);
    });

    this.transportes(faenaIndex).push(transporte);
    this.calcularFaena(faenaIndex);
  }

  removeTransporte(faenaIndex: number, transIndex: number) {
    this.transportes(faenaIndex).removeAt(transIndex);
    this.calcularFaena(faenaIndex);
  }

  // ===== CÁLCULOS =====
  calcularFaena(faenaIndex: number) {
    const faena = this.faenas().at(faenaIndex);
    let pesoBruto = 0;
    let pesoNeto = 0;
    let precioTotal = 0;

    // Sumar partes
    this.reses(faenaIndex).controls.forEach((res) => {
      (res.get('partes') as FormArray).controls.forEach((parte) => {
        const precioUnit = Number(parte.get('precioUnit')?.value) || 0;
        precioTotal += precioUnit;
      });
    });

    // Sumar transportes
    this.transportes(faenaIndex).controls.forEach((t) => {
      precioTotal += Number(t.get('costo')?.value) || 0;
    });

    // Sumar otros gastos
    precioTotal += Number(faena.get('otrosGastos')?.value) || 0;

    faena.patchValue(
      {
        pesoBruto,
        pesoNeto,
        precioTotal,
      },
      { emitEvent: false }
    );

    this.calcularTotalCompra();
  }

  calcularTotalCompra() {
    let total = 0;
    this.faenas().controls.forEach((faena) => {
      total += faena.get('precioTotal')?.value || 0;
    });
    this.compraForm.get('precioTotal')?.setValue(total);
  }

  // ===== SUBMIT =====
  submit() {
    if (!this.compraForm.valid) return;

    const payload = this.compraForm.getRawValue();
    console.log('Compra payload:', payload);

    this.compraService.create(payload).subscribe({
      next: (res) => console.log('Compra creada', res),
      error: (err) => console.error(err),
    });
  }

  // ===== PROVEEDORES =====
  getAllProveedores() {
    this.proveedorSvc.getAll().subscribe({
      next: (res) => {
        this.proveedores.set(res.data);
        this.resultados.set(res.data);
      },
    });
  }

  onBuscarProveedor(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.busqueda.set(value);

    if (value.length >= 1) {
      const filtrados = this.proveedores().filter(
        (prov) =>
          prov.nombre.toLowerCase().includes(value) || prov.nit_ci.toLowerCase().includes(value)
      );
      this.resultados.set(filtrados);
      this.mostrarResultados.set(true);
    } else {
      this.resultados.set([]);
      this.mostrarResultados.set(false);
    }
  }

  seleccionarProveedor(prov: ProveedorDto) {
    this.busqueda.set(prov.nombre);
    this.compraForm.get('proveedorId')?.setValue(prov.id_proveedor);
    this.mostrarResultados.set(false);
  }
}

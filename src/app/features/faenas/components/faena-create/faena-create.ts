import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FaenaService } from '../../services/faena.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  CreateDetalleFaenaDto,
  CreateFaenaDto,
  CreateTransporteDto,
} from '../../../../core/interfaces/faena.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faClipboardList,
  faCow,
  faDollar,
  faSave,
  faTimes,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-faena-create',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, FontAwesomeModule],
  templateUrl: './faena-create.html',
  styleUrl: './faena-create.css',
})
export class FaenaCreate {
  form!: FormGroup;
  faClipboardList = faClipboardList;
  faReceipt = faDollar;
  faCut = faCow;
  faTruck = faTruck;
  faSave = faSave;
  faTimes = faTimes;
  constructor(private fb: FormBuilder, private faenaService: FaenaService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      compraId: [null, Validators.required],
      propiedad: ['', Validators.required],
      numeroReses: [null, Validators.required],
      tipo: ['', Validators.required], // TipoGanado
      pesoBruto: [null],
      pesoNeto: [null],
      precioTotal: [null],
      precioDevolucion: [null],
      totalDevolucion: [null],
      otrosGastos: [0],
      saldoDepositar: [null],
      detalleFaena: this.fb.array([
        this.fb.group({
          tipoRes: ['', Validators.required],
          pesoRes: [null, Validators.required],
          precioRes: [null, Validators.required],
          pesoTotal: [null, Validators.required]
        }),
      ]),
      transportes: this.fb.array([
        this.fb.group({
          tipo: ['', Validators.required], // TipoTransporte
          descripcion: [''],
          costo: [null, Validators.required],
        }),
      ]),
    });
    this.generarDetalleFaena(this.form.get('numeroReses')!.value);
    this.form.get('numeroReses')!.valueChanges.subscribe((num: number) => {
      this.generarDetalleFaena(num);
    });
  }
  generarDetalleFaena(cantidad: number) {
    const detalles = this.detalleFaena;
    // Ajustar longitud del FormArray
    while (detalles.length < cantidad) {
      detalles.push(this.crearDetalle());
    }
    while (detalles.length > cantidad) {
      detalles.removeAt(detalles.length - 1);
    }
  }
  crearDetalle(): FormGroup {
    return this.fb.group({
      tipoRes: [''],
      pesoRes: [0],
      precioRes: [0],
      cantidad: [1],
      unidad: ['KG'],
    });
  }
  // Getters para los FormArray
  get detalleFaena(): FormArray {
    return this.form.get('detalleFaena') as FormArray;
  }

  get transportes(): FormArray {
    return this.form.get('transportes') as FormArray;
  }

  // Métodos Detalle Faena
  addDetalleFaena(): void {
    this.detalleFaena.push(
      this.fb.group({
        tipoRes: ['', Validators.required],
        pesoRes: [null, Validators.required],
        precioRes: [null, Validators.required],
        cantidad: [null, Validators.required],
        unidad: ['', Validators.required],
      })
    );
  }

  removeDetalleFaena(index: number): void {
    this.detalleFaena.removeAt(index);
  }

  // Métodos Transporte
  addTransporte(): void {
    this.transportes.push(
      this.fb.group({
        tipo: ['LOCAL', Validators.required],
        descripcion: [''],
        costo: [null, Validators.required],
      })
    );
  }

  removeTransporte(index: number): void {
    this.transportes.removeAt(index);
  }

  // Enviar formulario al backend
  onSubmit(): void {
    if (this.form.valid) {
      const dto: CreateFaenaDto = {
        compraId: this.form.value.compraId,
        propiedad: this.form.value.propiedad,
        numeroReses: this.form.value.numeroReses,
        tipo: this.form.value.tipo,
        pesoBruto: this.form.value.pesoBruto,
        pesoNeto: this.form.value.pesoNeto,
        precioTotal: this.form.value.precioTotal,
        precioDevolucion: this.form.value.precioDevolucion,
        totalDevolucion: this.form.value.totalDevolucion,
        otrosGastos: this.form.value.otrosGastos,
        saldoDepositar: this.form.value.saldoDepositar,
        detalleFaena: this.form.value.detalleFaena.map((d: any) => ({
          tipoRes: d.tipoRes,
          pesoRes: d.pesoRes,
          precioRes: d.precioRes,
          cantidad: d.cantidad,
          unidad: d.unidad,
        })) as CreateDetalleFaenaDto[],
        transportes: this.form.value.transportes.map((t: any) => ({
          tipo: t.tipo,
          descripcion: t.descripcion,
          costo: t.costo,
        })) as CreateTransporteDto[],
      };

      this.faenaService.create(dto).subscribe({
        next: (res) => console.log('✅ Faena creada:', res),
        error: (err) => console.error('❌ Error creando faena:', err),
      });
    } else {
      console.log('⚠️ Formulario inválido');
      this.form.markAllAsTouched();
    }
  }
}

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MataderoService } from '../../services/matadero.service';
import { CompraService } from '../../../compras/services/compra.service';
import { NotificationService } from '../../../../core/services/notification.service';

// @Component({
//   selector: 'app-matadero-edit',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterModule],
//   templateUrl: './matadero-edit.html',
// })
// export class MataderoEdit implements OnInit {
//   mataderoForm: FormGroup;
//   mataderoId: number | null = null;
//   cargando = signal<boolean>(true);
//   error = signal<string | null>(null);
//   enviando = signal<boolean>(false);
//   mataderoData: any = null;

//   // Cambiar router a público para que sea accesible desde la plantilla
//   router = inject(Router);
//   private fb = inject(FormBuilder);
//   private mataderoSvc = inject(MataderoService);
//   private compraSvc = inject(CompraService);
//   private route = inject(ActivatedRoute);
//   private notificationService = inject(NotificationService);

//   constructor() {
//     this.mataderoForm = this.crearFormularioMatadero();
//   }

//   ngOnInit(): void {
//     this.obtenerMatadero();
//   }

//   obtenerMatadero(): void {
//     this.mataderoId = Number(this.route.snapshot.paramMap.get('id'));

//     if (!this.mataderoId) {
//       this.error.set('ID de matadero no válido');
//       this.cargando.set(false);
//       return;
//     }

//     this.cargando.set(true);
//     this.mataderoSvc.getById(this.mataderoId).subscribe({
//       next: (resp) => {
//         console.log('Matadero recibido:', resp);
//         if (resp) {
//           this.mataderoData = resp;
//           this.cargarDatosFormulario(resp);
//         } else {
//           this.error.set('No se encontró el registro de matadero');
//         }
//         this.cargando.set(false);
//       },
//       error: (err) => {
//         console.error('Error al cargar matadero:', err);
//         this.error.set(
//           'No se pudo cargar el registro de matadero: ' + (err.message || 'Error desconocido')
//         );
//         this.cargando.set(false);
//       },
//     });
//   }

//   crearFormularioMatadero(): FormGroup {
//     return this.fb.group({
//       sec: [''],
//       odd: [''],
//       est: [''],
//       peso: [0, [Validators.required, Validators.min(0.01)]],
//       tipoRes: ['', Validators.required],
//       tipoIngreso: ['', Validators.required],
//       observaciones: [''],
//     });
//   }

//   cargarDatosFormulario(matadero: any): void {
//     this.mataderoForm.patchValue({
//       sec: matadero.sec || '',
//       odd: matadero.odd || '',
//       est: matadero.est || '',
//       peso: matadero.peso || 0,
//       tipoRes: matadero.tipoRes || '',
//       tipoIngreso: matadero.tipoIngreso || '',
//       observaciones: matadero.observaciones || '',
//     });
//   }

//   onSubmit(): void {
//     if (this.mataderoForm.invalid) {
//       this.mataderoForm.markAllAsTouched();
//       this.notificationService.showError('Complete todos los campos requeridos correctamente.');
//       return;
//     }

//     if (!this.mataderoId) {
//       this.notificationService.showError('ID de matadero no válido.');
//       return;
//     }

//     this.enviando.set(true);

//     const dataActualizada = {
//       ...this.mataderoForm.value,
//       peso: Number(this.mataderoForm.value.peso),
//     };

//     console.log('Actualizando matadero:', dataActualizada);

//     this.mataderoSvc.update(this.mataderoId, dataActualizada).subscribe({
//       next: (response) => {
//         console.log('Matadero actualizado exitosamente:', response);
//         this.enviando.set(false);
//         this.notificationService.showSuccess('Registro actualizado exitosamente!');

//         setTimeout(() => {
//           this.router.navigate(['/mataderos/lista']);
//         }, 1000);
//       },
//       error: (err) => {
//         console.error('Error al actualizar matadero:', err);
//         this.enviando.set(false);
//         this.notificationService.showError(
//           'Error al actualizar el registro: ' +
//             (err.error?.message || err.message || 'Error desconocido')
//         );
//       },
//     });
//   }

//   getProveedorNombre(): string {
//     if (!this.mataderoData?.compra?.proveedor) return 'N/A';
//     const proveedor = this.mataderoData.compra.proveedor;
//     if (typeof proveedor === 'object') {
//       return proveedor.nombre || proveedor.razonSocial || proveedor.nombreComercial || 'Proveedor';
//     }
//     return proveedor;
//   }

//   getFechaCompra(): string {
//     if (!this.mataderoData?.compra?.creado_en) return 'N/A';
//     const fecha = this.mataderoData.compra.creado_en;
//     try {
//       return new Date(fecha).toLocaleDateString('es-ES');
//     } catch {
//       return 'Fecha inválida';
//     }
//   }

//   getCompraDisplayText(): string {
//     if (!this.mataderoData?.compra) return 'N/A';
//     const compra = this.mataderoData.compra;
//     const proveedorText = this.getProveedorNombre();
//     const fechaText = this.getFechaCompra();
//     return `${compra.codigo} - ${proveedorText} (${fechaText})`;
//   }

//   // Método para navegar al listado (alternativa)
//   volverAlListado(): void {
//     this.router.navigate(['/mataderos/lista']);
//   }
// }

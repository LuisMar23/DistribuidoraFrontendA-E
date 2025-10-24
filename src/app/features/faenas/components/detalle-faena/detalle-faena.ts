import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DetalleFaenaService } from '../../services/faena.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DetalleFaena, Recibo } from '../../../../core/interfaces/faena.interface';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { ReciboService } from '../../../../core/services/recibo.service';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { faArrowCircleDown, faArrowDown, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-detalle-faena',
  imports: [CommonModule, ReactiveFormsModule, CommonModule, FontAwesomeModule, RouterLink],
  templateUrl: './detalle-faena.html',
})
export class DetalleFaenaDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private detalleFaenaService = inject(DetalleFaenaService);
  private notification = inject(NotificationService);
  faArrow = faArrowLeft;

  url = environment.fileServer;
  faena = signal<DetalleFaena | null>(null);
  isLoading = signal(true);

  modalReemplazarVisible = signal(false);
  reciboSeleccionado = signal<Recibo | null>(null);
  nuevoArchivo: File | null = null;

  formPago!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.formPago = this.fb.group({
      fechaPago: [null, Validators.required],
      formaPago: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notification.showError('ID de faena inválido');
      this.router.navigate(['/faenas']);
      return;
    }
    this.loadDetalle(id);
  }

  loadDetalle(id: number) {
    this.isLoading.set(true);
    this.detalleFaenaService.getById(id).subscribe({
      next: (res) => {
        console.log(res);
        this.faena.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.showError('No se pudo cargar el detalle');
        this.router.navigate(['/faenas']);
      },
    });
  }

  abrirModalReemplazar(recibo: Recibo) {
    this.reciboSeleccionado.set(recibo);
    this.modalReemplazarVisible.set(true);

    // Convertimos fechaPago a string yyyy-MM-dd
    let fechaStr = '';
    if (this.faena()?.fechaPago) {
      const fecha = new Date(this.faena()?.fechaPago ?? '');
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      fechaStr = `${yyyy}-${mm}-${dd}`;
    }

    // FormaPago en mayúscula para que coincida con los options
    let formaPago = this.faena()?.formaPago?.toUpperCase() || null;

    this.formPago.patchValue({
      fechaPago: fechaStr,
      formaPago: formaPago,
    });
  }

  onFileSeleccionado(event: any) {
    this.nuevoArchivo = event.target.files[0] ?? null;
  }
  async reemplazarRecibo() {
    if (!this.reciboSeleccionado() || !this.faena()) return;

    if (!this.nuevoArchivo) {
      this.notification.showWarning('Debe seleccionar un archivo');
      return;
    }

    try {
      await this.detalleFaenaService
        .actualizarImagen(this.faena()!.id, this.nuevoArchivo)
        .subscribe();

      this.notification.showSuccess('Recibo reemplazado correctamente');
      this.modalReemplazarVisible.set(false);
      this.nuevoArchivo = null;

      this.loadDetalle(this.faena()!.id);
    } catch (err: any) {
      console.error(err);
      const msg = err?.error?.message || 'Error al reemplazar el recibo';
      this.notification.showError(msg);
    }
  }
  cerrarModal() {
    this.modalReemplazarVisible.set(false);
    this.reciboSeleccionado.set(null);
    this.nuevoArchivo = null;
  }


}

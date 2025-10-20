import { Component, inject, signal } from '@angular/core';
import { faFileUpload } from '@fortawesome/free-solid-svg-icons';
import { CompraService } from '../../services/compra.service';
import { ReciboService } from '../../../../core/services/recibo.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-detalle-compra',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './detalle-compra.html',
  styleUrl: './detalle-compra.css',
})
export class DetalleCompra {
  faFileUpload = faFileUpload;
  serverFile = environment.fileServer;
compra = signal<any | null>(null);
  recibos = signal<any[]>([]);
  cargando = signal(false);

  modalImagenUrl = signal<string | null>(null);

  private compraService = inject(CompraService);
  private reciboService = inject(ReciboService);
  private route = inject(ActivatedRoute);


  ngOnInit(): void {
    const compraId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCompra(compraId);
  }

  cargarCompra(compraId: number) {
    this.cargando.set(true);
    this.compraService.getById(compraId).subscribe({
      next: (res) => {
        this.compra.set(res);
        this.recibos.set(res.recibos || []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar compra:', err);
        this.cargando.set(false);
      },
    });
  }


  abrirModalImagen(url: string) {
    console.log(url)
    this.modalImagenUrl.set(url);
  }

  cerrarModalImagen() {
    this.modalImagenUrl.set(null);
  }

  descargarArchivo(url: string, nombreArchivo: string) {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Error al descargar:', error);
        window.open(url, '_blank');
      });
  }

  eliminarRecibo(reciboId: number) {
    if (!confirm('¿Desea eliminar este recibo?')) return;

    this.reciboService.eliminar(reciboId).subscribe({
      next: () => {
        this.recibos.set(this.recibos().filter((r) => r.id !== reciboId));
      },
      error: (err) => {
        console.error('Error al eliminar recibo:', err);
        alert('Error al eliminar recibo');
      },
    });
  }
  get totalCompra(): number {
    const detalles = this.compra()?.detalles || [];
    const subtotal = detalles.reduce((sum: any, d: any) => sum + Number(d.precioTotal || 0), 0);
    return subtotal;
  }
}

import { Component, inject, signal } from '@angular/core';
import { CompraService } from '../../services/compra.service';
import { Compra } from '../../../../core/interfaces/compra.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-compra-list',
  imports: [CommonModule,RouterModule],
  templateUrl: './compra-list.html',
  styleUrl: './compra-list.css'
})
export class CompraList {
  // Signal para almacenar las compras
  compras = signal<any[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  private compraSvc=inject(CompraService)

  constructor() {}

  ngOnInit(): void {
  this.obtenerCompras()


  }

  obtenerCompras(page:number=1) {
    this.cargando.set(true);
    this.error.set(null);

    this.compraSvc.getAll(page,10).subscribe({
      next: (resp) => {
        console.log(resp.data)
        this.compras.set(resp.data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar compras:', err);
        this.error.set('No se pudieron cargar las compras');
        this.cargando.set(false);
      }
    });
  }

  // Acciones de la tabla
  verCompra(id: number) {
    console.log('Ver compra', id);
    // Aquí podrías navegar a un detalle
  }

  editarCompra(id: number) {
    console.log('Editar compra', id);
    // Aquí rediriges a /compras/editar/:id
  }

  eliminarCompra(id: number) {
    if (confirm('¿Seguro que quieres eliminar esta compra?')) {
      this.compraSvc.delete(id).subscribe({
        next: () => {
          this.compras.update((list) => list.filter((c) => c.id !== id));
        },
        error: (err) => {
          console.error('❌ Error al eliminar compra:', err);
        }
      });
    }
  }
}

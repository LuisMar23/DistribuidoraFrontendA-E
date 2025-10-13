import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MataderoService } from '../../services/matadero.service';
import { Matadero } from '../../../../core/interfaces/matadero.interface';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-matadero-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './matadero-list.html',
  styleUrls: ['./matadero-list.css'],
})
export class MataderoList implements OnInit {
  mataderos = signal<Matadero[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  page = signal<number>(1);
  pageSize = signal<number>(10);
  totalPages = signal<number>(1);
  mataderoSeleccionado = signal<Matadero | null>(null);
  mostrarModal = signal<boolean>(false);

  // Computed para compras únicas
  comprasUnicas = computed(() => {
    const comprasVistas = new Set<number>();
    const comprasUnicas: Matadero[] = [];

    this.mataderos().forEach((matadero) => {
      if (!comprasVistas.has(matadero.compra.id)) {
        comprasVistas.add(matadero.compra.id);
        comprasUnicas.push(matadero);
      }
    });

    return comprasUnicas;
  });

  // Computed para mataderos de la compra seleccionada
  mataderosCompraSeleccionada = computed(() => {
    const seleccionado = this.mataderoSeleccionado();
    if (!seleccionado) return [];
    return this.mataderos().filter((m) => m.compra.id === seleccionado.compra.id);
  });

  // Computed para contar registros con tipoRes
  registrosConTipoRes = computed(() => {
    return this.mataderosCompraSeleccionada().filter((m) => m.tipoRes).length;
  });

  private mataderoSvc = inject(MataderoService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.obtenerMataderos();
  }

  obtenerMataderos(page: number = 1) {
    this.cargando.set(true);
    this.error.set(null);
    this.mataderoSvc.getAll(page, this.pageSize()).subscribe({
      next: (resp) => {
        console.log('Respuesta del servicio:', resp);
        if (resp && resp.data) {
          this.mataderos.set(resp.data);
          this.totalPages.set(resp.meta?.totalPages || 1);
        } else {
          this.mataderos.set([]);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar mataderos:', err);
        this.error.set('No se pudieron cargar los registros del matadero');
        this.cargando.set(false);
      },
    });
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages()) {
      this.page.set(nuevaPagina);
      this.obtenerMataderos(nuevaPagina);
    }
  }

  verDetalles(matadero: Matadero) {
    this.mataderoSeleccionado.set(matadero);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.mataderoSeleccionado.set(null);
  }

  eliminarMatadero(id: number) {
    if (
      confirm(
        '¿Está seguro que desea eliminar TODOS los registros de matadero de esta compra? Esta acción no se puede deshacer.'
      )
    ) {
      this.mataderoSvc.delete(id).subscribe({
        next: (response) => {
          this.mataderos.update((list) => list.filter((m) => m.id !== id));
          this.notificationService.showSuccess(
            response.message || 'Registro eliminado correctamente'
          );
          if (this.mataderoSeleccionado()?.id === id) {
            this.cerrarModal();
          }
        },
        error: (err) => {
          console.error('Error al eliminar matadero:', err);
          this.notificationService.showError(
            err.error?.message || 'No se pudo eliminar el registro'
          );
        },
      });
    }
  }

  eliminarDesdeModal() {
    const matadero = this.mataderoSeleccionado();
    if (
      matadero &&
      confirm('¿Está seguro que desea eliminar este registro individual de matadero?')
    ) {
      this.mataderoSvc.delete(matadero.id).subscribe({
        next: (response) => {
          this.mataderos.update((list) => list.filter((m) => m.id !== matadero.id));
          this.notificationService.showSuccess(
            response.message || 'Registro eliminado correctamente'
          );
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al eliminar matadero:', err);
          this.notificationService.showError(
            err.error?.message || 'No se pudo eliminar el registro'
          );
        },
      });
    }
  }

  getPages(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.page() - 2);
    const endPage = Math.min(this.totalPages(), startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Método para obtener mataderos por compra (para uso interno)
  getMataderosPorCompra(compraId: number): Matadero[] {
    return this.mataderos().filter((m) => m.compra.id === compraId);
  }
}

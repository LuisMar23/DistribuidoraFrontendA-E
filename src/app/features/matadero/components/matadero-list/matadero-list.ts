// src/matadero/components/matadero-list/matadero-list.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MataderoService } from '../../services/matadero.service';
import { Matadero } from '../../../../core/interfaces/matadero.interface';

@Component({
  selector: 'app-matadero-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './matadero-list.html',
  styleUrls: ['./matadero-list.css'],
})
export class MataderoList {
  mataderos = signal<Matadero[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  page = signal<number>(1);
  pageSize = signal<number>(10);
  totalPages = signal<number>(1);

  private mataderoSvc = inject(MataderoService);

  ngOnInit(): void {
    this.obtenerMataderos();
  }

  obtenerMataderos(page: number = 1) {
    this.cargando.set(true);
    this.error.set(null);
    this.mataderoSvc.getAll(page, this.pageSize()).subscribe({
      next: (resp) => {
        console.log(resp.data);
        this.mataderos.set(resp.data);
        this.totalPages.set(resp.meta.totalPages);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar mataderos:', err);
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

  eliminarMatadero(id: number) {
    if (confirm('¿Seguro que quieres eliminar este registro de matadero?')) {
      this.mataderoSvc.delete(id).subscribe({
        next: () => {
          this.mataderos.update((list) => list.filter((m) => m.id !== id));
        },
        error: (err) => {
          console.error('❌ Error al eliminar matadero:', err);
          alert('No se pudo eliminar el registro');
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
}

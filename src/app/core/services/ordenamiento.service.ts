import { Injectable, Signal, WritableSignal, computed } from '@angular/core';

export interface TableState<T> {
  data: Signal<T[]>;
  searchTerm: WritableSignal<string>;
  sortColumn: WritableSignal<string>;
  sortDirection: WritableSignal<'asc' | 'desc'>;
}

@Injectable({ providedIn: 'root' })
export class DataTableService {
  /**
   * Filtra y ordena datos de acuerdo al estado de la tabla.
   */
  filteredAndSorted<T extends Record<string, any>>(
    state: TableState<T>,
    filterKeys: (keyof T)[]
  ): Signal<T[]> {
    return computed(() => {
      let arr = state.data();
      const term = state.searchTerm().toLowerCase();
      const col = state.sortColumn();
      const dir = state.sortDirection();

      // 🔍 Filtrado
      if (term) {
        arr = arr.filter((item) =>
          filterKeys.some((key) => {
            const value = item[key];
            return (
              value != null &&
              value.toString().toLowerCase().includes(term)
            );
          })
        );
      }

      // 🔽 Ordenado
      if (col) {
        arr = [...arr].sort((a, b) => {
          const valA = a[col];
          const valB = b[col];

          if (valA == null) return 1;
          if (valB == null) return -1;

          if (typeof valA === 'string' && typeof valB === 'string') {
            return dir === 'asc'
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          }

          if (valA instanceof Date && valB instanceof Date) {
            return dir === 'asc'
              ? valA.getTime() - valB.getTime()
              : valB.getTime() - valA.getTime();
          }

          return dir === 'asc'
            ? valA < valB
              ? -1
              : 1
            : valA < valB
            ? 1
            : -1;
        });
      }

      return arr;
    });
  }

  /**
   * Aplica paginación a un Signal de datos.
   */
  paginate<T>(
    data: Signal<T[]>,
    currentPage: Signal<number>,
    pageSize: Signal<number>
  ): Signal<T[]> {
    return computed(() => {
      const start = (currentPage() - 1) * pageSize();
      const end = start + pageSize();
      return data().slice(start, end);
    });
  }

  /**
   * Cambia el estado de orden (columna y dirección).
   */
  toggleSort<T>(state: TableState<T>, column: keyof T) {
    if (state.sortColumn() === column) {
      state.sortDirection.set(
        state.sortDirection() === 'asc' ? 'desc' : 'asc'
      );
    } else {
      state.sortColumn.set(column as string);
      state.sortDirection.set('asc');
    }
  }
}

// src/core/interfaces/matadero.interface.ts
export interface Matadero {
  id: number;
  sec?: number;
  odd?: number;
  est?: string;
  peso: number;
  tipoRes: string;
  tipoIngreso: string;
  observaciones?: string;
  creadoEn: string; // ISO string
  compra: {
    id: number;
    codigo: string;
    fechaCompra: string; // ISO string
    estado: 'pendiente' | 'pagado' | 'anulado';
    otrosGastos?: number;
    observaciones?: string;
    proveedor: {
      nombre: string;
      nit_ci?: string;
      telefono: string;
    };
    usuario: {
      fullName: string;
    };
    pesoTotalMatadero: number; // Nuevo campo
  };
}

export interface CreateMataderoDto {
  sec?: number;
  odd?: number;
  est?: string;
  peso: number;
  tipoRes: string;
  tipoIngreso: string;
  observaciones?: string;
  compraId: number;
}

export interface Caja {
  id: number;
  nombre: string;
  montoInicial: number;
  saldoActual: number;
  estado: 'ABIERTA' | 'CERRADA';
  usuarioApertura?: any;
}


export interface CierreCaja {
  id: number;
  cajaId: number;
  tipo: 'TOTAL' | 'PARCIAL';
  saldoInicial: number;
  saldoFinal: number;
  saldoReal: number;
  diferencia: number;
  observaciones?: string;
  fechaCierre: string;
}

export interface Movimiento {
  id: number;
  cajaId: number;
  usuarioId: number;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  descripcion?: string;
  metodoPago: string;
  referencia?: string;
  fecha: string;
}

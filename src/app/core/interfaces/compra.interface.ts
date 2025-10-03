export interface Parte {
  nombre: string;
  pesoNeto: number;
  precioUnit: number;
  observaciones?: string;
}

export interface Res {
  numero: number;
  partes: Parte[];
}

export interface Transporte {
  tipo: 'camion' | 'camioneta' | 'trailer';
  descripcion?: string;
  costo: number;
  observaciones?: string;
}

export interface Faena {
  propiedad: string;
  tipoGanado: 'bovino' | 'porcino' | 'ovino';
  tipoIngreso: 'compra' | 'consignacion';
  numeroReses: number;
  otrosGastos?: number;
  saldoDepositar?: number;
  pesoBruto?: number;
  pesoNeto?: number;
  precioTotal?: number;
  reses: Res[];
  transportes: Transporte[];
}

export interface CreateCompraDto {
  proveedorId: number;
  estado?: 'pendiente' | 'completado' | 'cancelado';
  observaciones?: string;
  precioTotal?: number;
  faenas: Faena[];
}
export interface Compra {
  id: number;
  codigo:string;
  fecha: string; // ISO string desde el backend
  proveedor: string;
  propiedad: string;
  numeroReses: number;
  pesoNeto: number;
  precioTotal: number;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
}
export interface DetalleFaena {
  id: number;
  fecha: string | Date;
  propiedad?: string;
  numeroReses?: number;
  precioDevolucion?: number;
  totalDevolucion?: number;
  transporte?: number;
  otrosGastos?: number;
  saldoDepositar: number;
  estadoPago: 'PENDIENTE' | 'PAGADO';
  fechaPago?: string | Date;
  formaPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE';
  compra?: {
    id: number;
    codigo: string;
  };
  recibos?: Recibo[];
}
export interface RegistrarPagoDto {
  fechaPago: string;
  formaPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE'; 
  referencia?: string;
  observaciones?: string;
  cajaId: number;         
}

export interface Recibo {
  id: number;
  urlArchivo: string;
  nombreArchivo?: string;
  creado_en: string | Date;
}

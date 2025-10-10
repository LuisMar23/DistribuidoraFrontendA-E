export interface DetalleFaena {
  id?: number;
  fecha: string | Date;
  propiedad: string;
  numeroReses: number;
  precioDevolucion: number;
  totalDevolucion: number;
  transporte?: number;
  otrosGastos?: number;
  saldoDepositar: number;

   compra?: {
    id: number;
    codigo: string;
  };

}


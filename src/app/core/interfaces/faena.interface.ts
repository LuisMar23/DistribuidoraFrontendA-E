export interface CreateDetalleFaenaDto {
  tipoRes: string;      
  pesoRes: number;     
  precioRes: number;   
  cantidad: number;     
  unidad: string;       
}

export interface CreateTransporteDto {
  tipo: 'LOCAL' | 'DEPARTAMENTAL';
  descripcion?: string;
  costo: number;
}

export interface CreateFaenaDto {
  compraId: number;
  propiedad: string;
  numeroReses: number;
  tipo: 'TORO' | 'VACA' | 'BECERRO'; 
  pesoBruto: number;
  pesoNeto: number;
  precioTotal: number;
  precioDevolucion?: number;
  totalDevolucion?: number;
  otrosGastos?: number;
  saldoDepositar: number;

  detalleFaena: CreateDetalleFaenaDto[];
  transportes?: CreateTransporteDto[];
}


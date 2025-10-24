export interface ProductDto {
  id_producto: number;
  codigo: string;
  peso: number;
  estado: boolean;
  observacion?: string;
  fecha_llegada: string;
  creado_en: string;

  compraGanadoId: number;
  compraGanado?: {
    id: number;
    codigo: string;
    fechaCompra: string;
  };
}

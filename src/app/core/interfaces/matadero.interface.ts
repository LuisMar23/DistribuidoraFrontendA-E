export interface Matadero {
  id: number;
  uuid: string;
  cantidad: number;
  fechaFaena: string;
  tipoRes: string;
  tipoIngreso?: string;
  observaciones?: string;
  totalKilos: number;
  compraId: number;
  creadoEn: string;
  compra?: {
    id: number;
    codigo: string;
  };
}

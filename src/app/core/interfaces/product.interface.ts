export interface ProductDto {
  id_producto: number;
  codigo: string;
  nombre: string;
  peso: number;
  precio: number; 
  estado: boolean;
  observacion?: string; 
  fecha_llegada: string; 
  creado_en: string;
}


export interface ProductDto {
  id_producto: number;
  uuid: string;
  nombre: string;
  categoria: string;
  unidad_medida: string;
  stock_actual: number;
  precio_base: number;
  estado: boolean;
  creado_en: string;
}

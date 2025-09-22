export interface TransportDto {
id_transporte?: number;
id_compra?: number;
transportista: string;
vehiculo: string;
costo_local: number;
costo_departamental: number;
fecha_salida: string;
fecha_llegada: string;
estado?: 'en_camino' | 'recibido' | 'cancelado';
}

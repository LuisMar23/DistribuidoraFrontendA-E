import { ProductDto } from './product.interface';

export interface VentaDto {
  id_venta?: number;
  id_cliente: number;
  id_usuario: number;
  fecha_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  estado: 'pendiente' | 'pagado' | 'anulado';
  cliente?: any;
  usuario?: any;
  detalles?: DetalleVentaDto[];
  // Agregar estas propiedades para el plan de pago
  PlanPago?: any;
  planPago?: any;
  plan_pago?: any;
  pagos?: any[];
}

export interface DetalleVentaDto {
  id_detalle?: number;
  ventaId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  producto?: ProductDto;
}

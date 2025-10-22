// venta.interface.ts
export interface VentaDto {
  id_venta?: number;
  uuid?: string;
  id_cliente: number;
  id_usuario: number;
  fecha_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'credito';
  estado: 'pendiente' | 'pagado' | 'anulado';
  observaciones?: string;
  cliente?: ClienteDto;
  usuario?: any;
  detalles?: DetalleVentaDto[];
  planPago?: PlanPagoDto;
}

export interface ClienteDto {
  id_cliente: number;
  persona?: {
    nombre: string;
    apellido: string;
  };
  nombre?: string;
}

export interface DetalleVentaDto {
  id?: number;
  uuid?: string;
  ventaId: number;
  productoId?: number;
  producto_codigo: string;
  nombre_producto: string;
  precio_por_kilo: number;
  precio_unitario: number;
  peso_original: number;
  descuento_peso: number;
  peso_final: number;
  subtotal: number;
  producto?: any;
}

export interface PlanPagoDto {
  id_plan_pago?: number;
  uuid?: string;
  ventaId: number;
  total: number;
  monto_inicial: number;
  plazo: number;
  periodicidad: 'DIAS' | 'SEMANAS' | 'MESES';
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado?: 'ACTIVO' | 'PAGADO' | 'CANCELADO';
  pagos?: PagoPlanDto[];
}

export interface PagoPlanDto {
  id_pago_plan?: number;
  uuid?: string;
  plan_pago_id: number;
  monto: number;
  fecha_pago: string;
  observacion?: string;
}

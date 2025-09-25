export interface ProveedorDto {
  id_proveedor?: number;
  nombre: string;
  nit_ci: string;
  telefono: string;
  direccion: string;
  departamento: string;
  email: string;
  isActive?: boolean;
  creado_en?: string;
}

export interface CountResponse {
  total: number;
}

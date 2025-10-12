export interface PersonaDto {
  id?: number;
  nombre: string;
  nit_ci: string;
  telefono: string;
  direccion: string;
  email?: string;
  isActive?: boolean;
  creado_en?: string;
  uuid?: string;
}

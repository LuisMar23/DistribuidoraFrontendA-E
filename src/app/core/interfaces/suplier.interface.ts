import { PersonaDto } from "./persona.interface";

export interface ProveedorDto {
  id_proveedor?: number;
  personaId?: number;
  persona: PersonaDto;  
  departamento: string;
  isActive?: boolean;
  creado_en?: string;
  uuid?: string;
}

export interface CountResponse {
  total: number;
}
  
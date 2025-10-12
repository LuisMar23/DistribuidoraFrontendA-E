interface ClientDto {
  id_cliente: number;
  persona: {
    nombre: string;
    nit_ci: string;
    telefono: string;
    direccion: string;
  
  };
  creado_en: string;
  isActive: boolean;
}

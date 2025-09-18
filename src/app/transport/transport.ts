import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { faBox, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TransportService, TransportDto } from '../services/transport.service';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './transport.html',
  styleUrls: ['./transport.css']
})
export class TransportComponent implements OnInit {
  faBox = faBox;
  faBoxOpen = faBoxOpen;

  transportes: TransportDto[] = [];
  showModal = false;
  searchTerm = '';

  // ✅ Inicializamos con tipos válidos según TransportDto
  newTransporte: Partial<TransportDto> = {
    id_compra: 0,
    transportista: '',
    vehiculo: '',
    costo_local: 0,
    costo_departamental: 0,
    fecha_salida: '',
    fecha_llegada: '',
    estado: 'en_camino' // literal permitido
  };

  constructor(private transportService: TransportService) {}

  ngOnInit(): void {
    this.loadTransportes();
  }

  loadTransportes(): void {
    this.transportService.getAll().subscribe({
      next: (data) => (this.transportes = data),
      error: (err) => console.error('Error al cargar transportes', err),
    });
  }

  toggleModal(): void {
    this.showModal = !this.showModal;
  }

  addTransporte(): void {
    // Convertimos fechas a ISO antes de enviar al backend
    const payload: Partial<TransportDto> = {
      ...this.newTransporte,
      fecha_salida: this.newTransporte.fecha_salida
        ? new Date(this.newTransporte.fecha_salida as string).toISOString()
        : undefined,
      fecha_llegada: this.newTransporte.fecha_llegada
        ? new Date(this.newTransporte.fecha_llegada as string).toISOString()
        : undefined,
    };

    this.transportService.create(payload).subscribe({
      next: (created) => {
        this.transportes.push(created);
        // Resetear formulario
        this.newTransporte = {
          id_compra: 0,
          transportista: '',
          vehiculo: '',
          costo_local: 0,
          costo_departamental: 0,
          fecha_salida: '',
          fecha_llegada: '',
          estado: 'en_camino'
        };
        this.toggleModal();
      },
      error: (err) => {
        console.error('Error al agregar transporte', err);
      },
    });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Transporte {
  id_transporte: number;
  id_compra: number;
  transportista: string;
  vehiculo: string;
  costo_local: number;
  costo_departamental: number;
  fecha_salida: string;
  fecha_llegada: string;
  estado: string;
}

@Component({
  selector: 'app-transport',
  standalone: true,           // importante
  imports: [CommonModule, FormsModule],  // <- necesario para pipes y ngModel
  templateUrl: './transport.html',
  styleUrls: ['./transport.css']
})
export class TransportComponent {
  transportes: Transporte[] = [
    {
      id_transporte: 1,
      id_compra: 101,
      transportista: 'Juan Pérez',
      vehiculo: 'Camión Volvo FH',
      costo_local: 150.5,
      costo_departamental: 320.75,
      fecha_salida: '2025-09-20T08:30:00.000Z',
      fecha_llegada: '2025-09-21T18:45:00.000Z',
      estado: 'en_camino'
    },
    {
      id_transporte: 2,
      id_compra: 102,
      transportista: 'María Gómez',
      vehiculo: 'Camión Scania',
      costo_local: 200,
      costo_departamental: 400,
      fecha_salida: '2025-09-21T09:00:00.000Z',
      fecha_llegada: '2025-09-22T19:00:00.000Z',
      estado: 'en_camino'
    }
  ];

  showModal = false;
  newTransporte: Partial<Transporte> = {};

  toggleModal() {
    this.showModal = !this.showModal;
  }

  addTransporte() {
    if (
      this.newTransporte.id_compra &&
      this.newTransporte.transportista &&
      this.newTransporte.vehiculo &&
      this.newTransporte.fecha_salida &&
      this.newTransporte.fecha_llegada
    ) {
      this.newTransporte.id_transporte = this.transportes.length + 1;
      this.newTransporte.estado = 'en_camino';
      this.transportes.push(this.newTransporte as Transporte);
      this.newTransporte = {};
      this.toggleModal();
    }
  }
}

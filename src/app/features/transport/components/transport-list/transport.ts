import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  faBox,
  faBoxOpen,
  faEye,
  faPenToSquare,
  faSearch,
  faTrash,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TransportDto } from '../../../../core/interfaces/transport.interface';
import { NotificationService } from '../../../../core/services/notification.service';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransportService } from '../../services/transport.service';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    CommonModule,
    RouterModule,
    DatePipe,
  ],
  templateUrl: './transport.html',
  styleUrl: './transport.css',
})
export class TransportComponent implements OnInit {
  // Iconos
  faTruck = faTruck;
  faBox = faBox;
  faBoxOpen = faBoxOpen;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faSearch = faSearch;

  // Signals
  allTransportes = signal<TransportDto[]>([]);
  transportes = signal<TransportDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  form: FormGroup;
  editMode = signal(false);

  // Columnas para la tabla
  columns = [
    { key: 'id_transporte', label: 'N°' },
    { key: 'estado', label: 'Estado' },
    { key: 'transportista', label: 'Transportista' },
    { key: 'vehiculo', label: 'Vehículo' },
    { key: 'costo_local', label: 'Costo Local' },
    { key: 'costo_departamental', label: 'Costo Departamental' },
    { key: 'fecha_salida', label: 'Fecha Salida' },
    { key: 'fecha_llegada', label: 'Fecha Llegada' },
  ];

  // Paginación
  total = signal(0);
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<string>('fecha_salida');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Servicios
  _notificationService = inject(NotificationService);

  constructor(private transportService: TransportService, private fb: FormBuilder) {
    this.form = this.fb.group({
      id_compra: [0, [Validators.required, Validators.min(1)]],
      transportista: ['', Validators.required],
      vehiculo: ['', Validators.required],
      costo_local: [0, [Validators.required, Validators.min(0)]],
      costo_departamental: [0, [Validators.required, Validators.min(0)]],
      fecha_salida: ['', Validators.required],
      fecha_llegada: ['', Validators.required],
      estado: ['en_camino', Validators.required],
    });
  }

  ngOnInit() {
    this.loadTransportes();
  }

  // Función para formatear moneda con Bs. al final (sin decimales)
  formatCurrency(value: number | undefined | null): string {
    if (value == null || value === undefined) return '0 Bs.';

    // Formatear el número sin decimales
    const formattedValue = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

    return `${formattedValue} Bs.`;
  }

  loadTransportes() {
    this.transportService.getAll().subscribe({
      next: (data: TransportDto[]) => {
        this.allTransportes.set(data);
        this.applyFilterAndPagination();
      },
      error: (error) => {
        this._notificationService.showError('Error al cargar los transportes');
        console.error('Error loading transports:', error);
      },
    });
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.applyFilterAndPagination();
  }

  applyFilterAndPagination() {
    let filtered = this.allTransportes();

    // Aplicar búsqueda
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(
        (t) =>
          (t.transportista || '').toLowerCase().includes(term) ||
          (t.vehiculo || '').toLowerCase().includes(term) ||
          (t.estado || '').toLowerCase().includes(term) ||
          (t.id_transporte?.toString() || '').includes(term)
      );
    }

    // Aplicar ordenamiento
    filtered = this.sortData(filtered);

    // Actualizar total
    this.total.set(filtered.length);

    // Aplicar paginación
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    this.transportes.set(filtered.slice(startIndex, endIndex));
  }

  sortData(data: TransportDto[]): TransportDto[] {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return [...data].sort((a, b) => {
      let aValue: any = a[column as keyof TransportDto];
      let bValue: any = b[column as keyof TransportDto];

      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (column === 'fecha_salida' || column === 'fecha_llegada') {
        aValue = new Date(aValue || '').getTime();
        bValue = new Date(bValue || '').getTime();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  submit() {
    if (this.form.invalid) {
      this._notificationService.showError('Por favor, complete todos los campos requeridos');
      return;
    }

    const data = { ...this.form.value };

    // Manejo robusto de fechas
    try {
      if (data.fecha_salida) {
        const fechaSalida = new Date(data.fecha_salida);
        if (!isNaN(fechaSalida.getTime())) {
          data.fecha_salida = fechaSalida.toISOString();
        } else {
          this._notificationService.showError('Fecha de salida inválida');
          return;
        }
      }

      if (data.fecha_llegada) {
        const fechaLlegada = new Date(data.fecha_llegada);
        if (!isNaN(fechaLlegada.getTime())) {
          data.fecha_llegada = fechaLlegada.toISOString();
        } else {
          this._notificationService.showError('Fecha de llegada inválida');
          return;
        }
      }
    } catch (error) {
      this._notificationService.showError('Error procesando las fechas');
      console.error('Error con fechas:', error);
      return;
    }

    // DEBUG: Ver qué se está enviando
    console.log('Datos a enviar:', data);
    console.log('Edit mode:', this.editMode());
    console.log('ID:', this.editId());

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.transportService.update(id, data).subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);
            this._notificationService.showSuccess('Transporte actualizado correctamente');
            this.loadTransportes();
            this.cancelEdit();
          },
          error: (error) => {
            console.error('Error completo updating transport:', error);
            console.error('Status:', error.status);
            console.error('Error message:', error.message);
            console.error('Error body:', error.error);
            
            this._notificationService.showError('Error al actualizar el transporte');
          },
        });
      }
    } else {
      this.transportService.create(data).subscribe({
        next: () => {
          this._notificationService.showSuccess('Transporte creado correctamente');
          this.loadTransportes();
          this.cancelEdit();
        },
        error: (error) => {
          this._notificationService.showError('Error al crear el transporte');
          console.error('Error creating transport:', error);
        },
      });
    }
  }

  edit(transporte: TransportDto) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(transporte.id_transporte!);

    // Prepara los datos del formulario con manejo de errores
    const formData: any = {
      ...transporte
    };

    // Manejo seguro de fechas
    try {
      formData.fecha_salida = this.formatDateForInput(transporte.fecha_salida);
      formData.fecha_llegada = this.formatDateForInput(transporte.fecha_llegada);
    } catch (error) {
      console.error('Error preparando fechas para edición:', error);
      // Si hay error, dejamos las fechas como están
      formData.fecha_salida = transporte.fecha_salida || '';
      formData.fecha_llegada = transporte.fecha_llegada || '';
    }

    this.form.patchValue(formData);
  }

  private formatDateForInput(dateString: string | undefined): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Verifica si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateString);
        return '';
      }
      
      // Formato: YYYY-MM-DDTHH:mm (para input datetime-local)
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
  }

  openModal() {
    this.showModal.set(true);
    this.editMode.set(false);
    this.form.reset({
      estado: 'en_camino',
      id_compra: 0,
      costo_local: 0,
      costo_departamental: 0,
      fecha_salida: '',
      fecha_llegada: ''
    });
  }

  cancelEdit() {
    this.showModal.set(false);
    this.editMode.set(false);
    this.editId.set(null);
    this.form.reset({
      estado: 'en_camino',
      id_compra: 0,
      costo_local: 0,
      costo_departamental: 0,
      fecha_salida: '',
      fecha_llegada: ''
    });
  }

  delete(transporte: TransportDto) {
    this._notificationService
      .confirmDelete(`¿Está seguro de eliminar el transporte de ${transporte.transportista}?`)
      .then((result) => {
        if (result.isConfirmed) {
          this.transportService.delete(transporte.id_transporte!).subscribe({
            next: () => {
              this._notificationService.showSuccess('Transporte eliminado correctamente');
              this.loadTransportes();
            },
            error: (error) => {
              this._notificationService.showError('Error al eliminar el transporte');
              console.error('Error deleting transport:', error);
            },
          });
        }
      });
  }

  sort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.applyFilterAndPagination();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.applyFilterAndPagination();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.applyFilterAndPagination();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.applyFilterAndPagination();
    }
  }

  totalPages(): number {
    return Math.ceil(this.total() / this.pageSize());
  }

  pageArray(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  rangeStart(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    const end = this.currentPage() * this.pageSize();
    const totalItems = this.total();
    return end > totalItems ? totalItems : end;
  }

  getEstadoClass(estado: string | undefined): string {
    switch (estado) {
      case 'recibido':
        return 'bg-green-100 text-green-800';
      case 'en_camino':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
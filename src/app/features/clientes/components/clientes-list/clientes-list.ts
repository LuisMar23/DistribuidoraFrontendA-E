import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  faUser,
  faUsers,
  faEye,
  faPenToSquare,
  faTrash,
  faFileExcel,
  faFilePdf,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, DatePipe } from '@angular/common';

import { ClientService } from '../../services/cliente.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { PdfService } from '../../../../core/services/pdf.service';
import { VentaService } from '../../../venta/services/venta.service';

export interface ClientDto {
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

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './clientes-list.html',
  styleUrls: ['./clientes-list.css'],
  providers: [DatePipe],
})
export class ClientComponent {
  faUser = faUser;
  faUsers = faUsers;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faFileExcel = faFileExcel;
  faFilePdf = faFilePdf;
  faMoneyBillWave = faMoneyBillWave;

  clients = signal<ClientDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  form: FormGroup;
  editMode = signal(false);

  clientesConDeudas = signal<any[]>([]);
  cargandoDeudas = signal(false);

  columns = [
    { key: 'id_cliente', label: 'N°' },
    { key: 'nombre', label: 'Nombre de Cliente' },
    { key: 'nit_ci', label: 'NIT/CI' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'creado_en', label: 'Fecha Creacion' },
  ];

  total = signal(0);
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('desc');

  private _notificationService = inject(NotificationService);
  private _ventaService = inject(VentaService);
  private pdfService = inject(PdfService);
  private datePipe = inject(DatePipe);

  constructor(private clientService: ClientService, private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      nit_ci: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.minLength(6)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.loadClients();
  }

  loadClients() {
    this.clientService.getAll(this.currentPage(), this.pageSize()).subscribe({
      next: (data: ClientDto[]) => {
        this.clients.set(Array.isArray(data) ? data : []);
        this.total.set(this.clients().length);
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
        this._notificationService.showError('Error al cargar los clientes');
        this.clients.set([]);
      },
    });
  }

  filteredClients = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return this.clients();

    return this.clients().filter(
      (client) =>
        client?.persona?.nombre?.toLowerCase().includes(search) ||
        client?.persona?.nit_ci?.toLowerCase().includes(search) ||
        client?.persona?.telefono?.toLowerCase().includes(search) ||
        client?.persona?.direccion?.toLowerCase().includes(search)
    );
  });

  paginatedClients = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.filteredClients().slice(startIndex, endIndex);
  });

  toggleSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.ordenarClientes();
  }

  ordenarClientes() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.clients()];
    arr.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (col === 'nombre') {
        valA = a.persona.nombre;
        valB = b.persona.nombre;
      } else if (col === 'nit_ci') {
        valA = a.persona.nit_ci;
        valB = b.persona.nit_ci;
      } else if (col === 'telefono') {
        valA = a.persona.telefono;
        valB = b.persona.telefono;
      } else if (col === 'direccion') {
        valA = a.persona.direccion;
        valB = b.persona.direccion;
      } else {
        valA = a[col as keyof ClientDto];
        valB = b[col as keyof ClientDto];
      }

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });

    this.clients.set(arr);
  }

  cargarClientesConDeudas() {
    this.cargandoDeudas.set(true);
    this._ventaService.obtenerClientesConDeudas().subscribe({
      next: (deudas) => {
        if (!deudas || !Array.isArray(deudas)) {
          this._notificationService.showAlert('No se encontraron datos válidos de deudas');
          this.cargandoDeudas.set(false);
          return;
        }

        this.clientesConDeudas.set(deudas);
        this.cargandoDeudas.set(false);

        if (deudas.length === 0) {
          this._notificationService.showAlert('No se encontraron clientes con deudas pendientes');
        } else {
          this.generarPdfDeudas();
        }
      },
      error: (error) => {
        console.error('Error cargando clientes con deudas:', error);
        this._notificationService.showError('Error al cargar los clientes con deudas');
        this.cargandoDeudas.set(false);
      },
    });
  }

  generarPdfDeudas() {
    const deudas = this.clientesConDeudas();
    if (!deudas || deudas.length === 0) {
      this._notificationService.showAlert(
        'No hay clientes con deudas pendientes para generar el PDF'
      );
      return;
    }

    try {
      this.pdfService.downloadDeudasPdf(deudas);
      this._notificationService.showSuccess('PDF de deudas generado correctamente');
    } catch (error) {
      console.error('Error generando PDF de deudas:', error);
      this._notificationService.showError('Error al generar el PDF de deudas');
    }
  }

  formatDate(date?: string | Date): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return this.datePipe.transform(d, 'dd/MM/yyyy') || '';
    } catch {
      return '';
    }
  }

  submit() {
    if (this.form.invalid) {
      this._notificationService.showAlert(
        'Por favor complete todos los campos requeridos correctamente'
      );
      this.markFormGroupTouched(this.form);
      return;
    }

    const data = this.form.value;

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.clientService.update(id, data).subscribe({
          next: () => {
            this._notificationService.showSuccess('Cliente actualizado correctamente');
            this.loadClients();
            this.cancelEdit();
          },
          error: (error) => {
            console.error('Error actualizando cliente:', error);
            this._notificationService.showError('Error al actualizar el cliente');
          },
        });
      }
    } else {
      this.clientService.create(data).subscribe({
        next: () => {
          this._notificationService.showSuccess('Cliente creado correctamente');
          this.loadClients();
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error creando cliente:', error);
          const msg = error.error?.message || 'Error al crear el cliente';
          this._notificationService.showError(msg);
        },
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  edit(client: ClientDto) {
    if (!client) return;

    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(client.id_cliente);

    const p = client.persona;
    this.form.patchValue({
      nombre: p.nombre || '',
      nit_ci: p.nit_ci || '',
      telefono: p.telefono || '',
      direccion: p.direccion || '',
    });
  }

  openModal() {
    this.showModal.set(true);
    this.editMode.set(false);
    this.form.reset({
      nombre: '',
      nit_ci: '',
      telefono: '',
      direccion: '',
    });
  }

  cancelEdit() {
    this.showModal.set(false);
    this.editMode.set(false);
    this.editId.set(null);
    this.form.reset({
      nombre: '',
      nit_ci: '',
      telefono: '',
      direccion: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  delete(client: ClientDto) {
    if (!client) return;

    this._notificationService
      .confirmDelete(`¿Está seguro de eliminar al cliente ${client.persona.nombre}?`)
      .then((result) => {
        if (result.isConfirmed) {
          this.clientService.delete(client.id_cliente).subscribe({
            next: () => {
              this._notificationService.showSuccess('Cliente eliminado correctamente');
              this.loadClients();
            },
            error: (error) => {
              console.error('Error eliminando cliente:', error);
              this._notificationService.showError('Error al eliminar el cliente');
            },
          });
        }
      });
  }

  view(c: ClientDto) {
    if (!c) return;
    this._notificationService.showInfo(`Viendo detalles de ${c.persona.nombre}`);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.loadClients();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.loadClients();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadClients();
    }
  }

  totalPages() {
    return Math.ceil(this.total() / this.pageSize()) || 1;
  }

  pageArray(): number[] {
    const pages = this.totalPages();
    return Array.from({ length: pages }, (_, i) => i + 1);
  }

  rangeStart(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    const end = this.currentPage() * this.pageSize();
    return end > this.total() ? this.total() : end;
  }

  downloadExcel() {
    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      worksheet.columns = [
        { header: 'N°', key: 'numero', width: 8 },
        { header: 'ID Cliente', key: 'id_cliente', width: 12 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'NIT/CI', key: 'nit_ci', width: 20 },
        { header: 'Teléfono', key: 'telefono', width: 20 },
        { header: 'Dirección', key: 'direccion', width: 40 },
        { header: 'Fecha de Registro', key: 'creado_en', width: 25 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF7676' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      const clientes = this.filteredClients();

      clientes.forEach((cliente, index) => {
        if (!cliente) return;

        const p = cliente.persona || {};

        const row = worksheet.addRow({
          numero: index + 1,
          id_cliente: cliente.id_cliente || 'N/A',
          nombre: p.nombre || 'N/A',
          nit_ci: p.nit_ci || 'N/A',
          telefono: p.telefono || 'N/A',
          direccion: p.direccion || 'N/A',
          creado_en: this.formatDate(cliente.creado_en),
        });

        row.getCell('numero').alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          };
        });

        if (index % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9F9F9' },
            };
          });
        }
      });

      worksheet.eachRow({ includeEmpty: false }, (row) => {
        row.height = 22;
      });

      const totalRow = worksheet.addRow({
        numero: '',
        id_cliente: '',
        nombre: `Total de clientes: ${clientes.length}`,
        nit_ci: '',
        telefono: '',
        direccion: '',
        creado_en: new Date().toLocaleDateString('es-BO'),
      });

      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      workbook.xlsx
        .writeBuffer()
        .then((data) => {
          const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const fecha = new Date().toISOString().split('T')[0];
          saveAs(blob, `Clientes_${fecha}.xlsx`);
          this._notificationService.showSuccess('Excel generado correctamente');
        })
        .catch((error) => {
          console.error('Error generando Excel:', error);
          this._notificationService.showError('Error al generar el Excel');
        });
    } catch (error) {
      console.error('Error en downloadExcel:', error);
      this._notificationService.showError('Error al generar el archivo Excel');
    }
  }

  downloadPDF() {
    try {
      const clientes = this.filteredClients();
      if (clientes.length === 0) {
        this._notificationService.showAlert('No hay clientes para generar el PDF');
        return;
      }

      this.pdfService.downloadTablePdf({
        title: 'Sistema Ventas Carnes A&E ',
        subtitle: 'Lista de Clientes',
        columns: [
          { header: 'N°', dataKey: 'numero', width: 30, alignment: 'center' },
          { header: 'ID', dataKey: 'id_cliente', width: 40, alignment: 'center' },
          { header: 'Nombre', dataKey: 'nombre', width: '*', alignment: 'left' },
          { header: 'NIT/CI', dataKey: 'nit_ci', width: 70, alignment: 'center' },
          { header: 'Teléfono', dataKey: 'telefono', width: 70, alignment: 'center' },
          { header: 'Dirección', dataKey: 'direccion', width: 120, alignment: 'left' },
          { header: 'Fecha', dataKey: 'creado_en', width: 70, alignment: 'center' },
        ],
        data: clientes.map((c, index) => ({
          numero: index + 1,
          id_cliente: c.id_cliente || 'N/A',
          nombre: c.persona?.nombre || 'N/A',
          nit_ci: c.persona?.nit_ci || 'N/A',
          telefono: c.persona?.telefono || 'N/A',
          direccion: c.persona?.direccion || 'N/A',
          creado_en: this.formatDate(c.creado_en),
        })),
        fileName: 'Clientes',
        pageOrientation: 'landscape',
        showFooter: true,
        footerText: 'Distribuidora A-E - Sistema de Gestión',
      });

      this._notificationService.showSuccess('PDF generado correctamente');
    } catch (error) {
      console.error('Error en downloadPDF:', error);
      this._notificationService.showError('Error al generar el PDF');
    }
  }
}

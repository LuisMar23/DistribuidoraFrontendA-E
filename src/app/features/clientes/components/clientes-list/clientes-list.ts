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
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { CommonModule } from '@angular/common';

import { ClientService } from '../../services/cliente.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { PdfService } from '../../../../core/services/pdf.service';
import { DataTableService, TableState } from '../../../../core/services/ordenamiento.service';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './clientes-list.html',
  styleUrls: ['./clientes-list.css'],
})
export class ClientComponent {
  faUser = faUser;
  faUsers = faUsers;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faFileExcel = faFileExcel;
  clients = signal<ClientDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  form: FormGroup;
  editMode = signal(false);

  clientes = signal<ClientDto[]>([]);

  columns = [
    { key: 'id', label: 'N°' },
    { key: 'nombre', label: 'Nombre de Proveedor' },
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
  private pdfService = inject(PdfService);
  constructor(private clientService: ClientService, private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      nit_ci: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
    });

    this.loadClients();
  }

  loadClients() {
    this.clientService
      .getAll(this.currentPage(), this.pageSize())
      .subscribe((data: ClientDto[]) => {
        this.clients.set(data);
        this.total.set(data.length);
      });
  }

  // filteredClients = computed(() => {
  //   let arr = this.clients();

  //   // Primero ordenar
  //   const col = this.sortColumn();
  //   const dir = this.sortDirection();

  //   if (col) {
  //     arr = [...arr].sort((a, b) => {
  //       // Acceder a las propiedades a través de persona
  //       let valA: any;
  //       let valB: any;

  //       if (col === 'id_cliente') {
  //         valA = a.id_cliente;
  //         valB = b.id_cliente;
  //       } else if (col === 'creado_en') {
  //         valA = a.creado_en;
  //         valB = b.creado_en;
  //       } else {
  //         // Para nombre, nit_ci, telefono, direccion
  //         valA = a.persona?.[col as keyof typeof a.persona];
  //         valB = b.persona?.[col as keyof typeof b.persona];
  //       }

  //       if (valA == null) return 1;
  //       if (valB == null) return -1;

  //       if (typeof valA === 'string' && typeof valB === 'string') {
  //         return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  //       }

  //       // Para fechas y números
  //       if (valA instanceof Date && valB instanceof Date) {
  //         return dir === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
  //       }

  //       return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
  //     });
  //   }

  //   // Luego filtrar
  //   const term = this.searchTerm().toLowerCase();
  //   if (!term) return arr;

  //   return arr.filter((c) => {
  //     const p = c.persona;
  //     return (
  //       (p.nombre || '').toLowerCase().includes(term) ||
  //       (p.nit_ci || '').toLowerCase().includes(term) ||
  //       (p.telefono || '').toLowerCase().includes(term) ||
  //       (p.direccion || '').toLowerCase().includes(term)
  //     );
  //   });
  // });
  private dataTable = inject(DataTableService);

  tableState: TableState<any> = {
    data: this.clients,
    searchTerm: this.searchTerm,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection,
  };
  filteredClients = this.dataTable.filteredAndSorted(this.tableState, [
    'persona.nombre',
    'persona.nit_ci',
    'persona.telefono',
    'persona.direccion',
  ]);

  paginatedClients = this.dataTable.paginate(this.filteredClients, this.currentPage, this.pageSize);

  toggleSort(column: any) {
    this.dataTable.toggleSort(this.tableState, column);
  }

  // Simplifica el método sort
  // sort(column: string) {
  //   console.log('Ordenando por:', column);

  //   if (this.sortColumn() === column) {
  //     this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     this.sortColumn.set(column);
  //     this.sortDirection.set('asc');
  //   }
  //   // No necesitas llamar a ordenarClientes() porque filteredClients es computed
  // }

  // ELIMINA el método ordenarClientes() completamente

  ordenarClientes() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.clientes()];

    arr.sort((a, b) => {
      const valA = a[col as keyof ClientDto];
      const valB = b[col as keyof ClientDto];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });

    this.clientes.set(arr);
  }

  submit() {
    if (this.form.invalid) {
      this._notificationService.showAlert('Formulario inválido');
      return;
    }

    const data = this.form.value;

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.clientService.update(id, data).subscribe({
          next: (result) => {
            this._notificationService.showSuccess(`Cliente actualizado: ${result}`);
            this.loadClients();
            this.cancelEdit();
          },
          error: (error) => {
            this._notificationService.showError(`Error al actualizar cliente: ${error}`);
          },
        });
      }
    } else {
      this.clientService.create(data).subscribe({
        next: (result) => {
          this._notificationService.showSuccess(`Cliente creado: ${result}`);
          this.loadClients();
          this.cancelEdit();
        },
        error: (error) => {
          const msg = error.error?.message || 'Error al crear cliente';
          this._notificationService.showError(msg);
        },
      });
    }
  }
  edit(client: ClientDto) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(client.id_cliente!);

    const p = client.persona;
    this.form.patchValue({
      nombre: p.nombre,
      nit_ci: p.nit_ci,
      telefono: p.telefono,
      direccion: p.direccion,
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
      email: '',
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
      email: '',
    });
  }

  delete(data: any) {
    this._notificationService
      .confirmDelete(`Se eliminara al cliente ${data.nombre}`)
      .then((result) => {
        if (result.isConfirmed) {
          this._notificationService.showSuccess('Eliminado correctamente');
          this.clientService.delete(data.id).subscribe(() => this.loadClients());
        }
      });
  }

  view(c: ClientDto) {
    console.log('Ver cliente:', c);
  }

  // sort(column: string) {
  //   console.log("adadada")
  //   console.log(column)

  //   if (this.sortColumn() === column) {
  //     this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     this.sortColumn.set(column);
  //     this.sortDirection.set('asc');
  //   }
  //   this.ordenarClientes();
  // }

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
    return Math.ceil(this.total() / this.pageSize());
  }

  pageArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  rangeStart(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    const end = this.currentPage() * this.pageSize();
    return end > this.total() ? this.total() : end;
  }

  // formatDate(dateString: string | undefined): string {
  //   if (!dateString) return 'N/A';
  //   return new Date(dateString).toLocaleString();
  // }

  downloadExcel() {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Clientes');

    // Definir columnas
    worksheet.columns = [
      { header: 'N°', key: 'numero', width: 8 },
      { header: 'ID Cliente', key: 'id_cliente', width: 12 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'NIT/CI', key: 'nit_ci', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Dirección', key: 'direccion', width: 40 },
      { header: 'Fecha de Registro', key: 'creado_en', width: 25 },
    ];

    // Estilo de encabezado
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
      const p = cliente.persona;

      const row = worksheet.addRow({
        numero: index + 1,
        id_cliente: cliente.id_cliente,
        nombre: p.nombre || 'N/A',
        nit_ci: p.nit_ci || 'N/A',
        telefono: p.telefono || 'N/A',
        direccion: p.direccion || 'N/A',
        creado_en: this.formatDate(cliente.creado_en),
      });

      // Centrar la columna N°
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

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fecha = new Date().toISOString().split('T')[0];
      saveAs(blob, `Clientes_${fecha}.xlsx`);
    });
  }

  formatDate(date?: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  downloadPDF() {
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
      data: this.filteredClients().map((c, index) => ({
        numero: index + 1,
        id_cliente: c.id_cliente,
        nombre: c.persona.nombre || 'N/A',
        nit_ci: c.persona.nit_ci || 'N/A',
        telefono: c.persona.telefono || 'N/A',
        direccion: c.persona.direccion || 'N/A',
        creado_en: this.formatDate(c.creado_en),
      })),
      fileName: 'Clientes',
      pageOrientation: 'landscape', // Horizontal para más columnas
      // headerColor: '#ff7676',
      // alternateRowColor: '#f9f9f9',
      showFooter: true,
      footerText: 'Distribuidora A-E - Sistema de Gestión',
    });
  }
}

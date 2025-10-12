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
import { ClientDto } from '../../../../core/interfaces/client.interface';
import { ClientService } from '../../services/cliente.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

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

  // ✅ Eliminada la señal duplicada: 'clientes'

  columns = [
    { key: 'id_cliente', label: 'N°' },
    { key: 'nombre', label: 'Nombre de Cliente' },
    { key: 'nit_ci', label: 'NIT/CI' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'creado_en', label: 'Fecha Creación' },
  ];

  total = signal(0);
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('desc');

  private _notificationService = inject(NotificationService);

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
    this.clientService.getAll().subscribe((data: ClientDto[]) => {
      this.clients.set(data);
      this.total.set(data.length);
    });
  }

  filteredClients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.clients().filter(
      (c) =>
        (c.nombre || '').toLowerCase().includes(term) ||
        (c.nit_ci || '').toLowerCase().includes(term) ||
        (c.telefono || '').toLowerCase().includes(term) ||
        (c.direccion || '').toLowerCase().includes(term)
      // ✅ email eliminado del filtro
    );
  });

  ordenarClientes() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.clients()]; // ✅ Usa 'clients', no 'clientes'

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

    this.clients.set(arr); // ✅ Actualiza la señal correcta
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
          this._notificationService.showError(`Error al crear cliente: ${error}`);
        },
      });
    }
  }

  edit(client: ClientDto) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(client.id_cliente!);

    this.form.patchValue({
      nombre: client.nombre,
      nit_ci: client.nit_ci,
      telefono: client.telefono,
      direccion: client.direccion,
      // ✅ email eliminado
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
      // ✅ email eliminado
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
      // ✅ email eliminado
    });
  }

  delete(data: any) {
    this._notificationService
      .confirmDelete(`Se eliminará al cliente ${data.nombre}`)
      .then((result) => {
        if (result.isConfirmed) {
          this._notificationService.showSuccess('Eliminado correctamente');
          this.clientService.delete(data.id_cliente).subscribe(() => this.loadClients());
        }
      });
  }

  view(c: ClientDto) {
    console.log('Ver cliente:', c);
  }

  sort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.ordenarClientes();
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

  downloadExcel() {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Clientes');

    worksheet.columns = [
      { header: 'ID', key: 'id_cliente', width: 10 },
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

    const clientes = this.clients();
    clientes.forEach((cliente) => {
      worksheet.addRow({
        id_cliente: cliente.id_cliente,
        nombre: cliente.nombre,
        nit_ci: cliente.nit_ci,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        creado_en: this.formatDate(cliente.creado_en),
      });
    });

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.height = 22;
    });

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `Clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
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
}

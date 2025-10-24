// src/proveedor/components/proveedor.component.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import departamentos from '../../../../../assets/departamentos.json';
import {
  faBox,
  faBoxOpen,
  faEye,
  faFileExcel,
  faFilePdf,
  faPenToSquare,
  faSearch,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProveedorDto } from '../../../../core/interfaces/suplier.interface';

import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProveedorService } from '../../services/proveedor.service';
import { RouterModule } from '@angular/router';
import { PdfService } from '../../../../core/services/pdf.service';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FontAwesomeModule, CommonModule, RouterModule],
  templateUrl: './proveedor.html',
  styleUrl: './proveedor.css',
})
export class ProveedorComponent {
  faBox = faBox;
  faBoxOpen = faBoxOpen;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faSearch = faSearch;
  faFileExcel = faFileExcel;
  faFilePdf = faFilePdf;

  private pdfService = inject(PdfService);
  proveedores = signal<ProveedorDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  departments: string[] = [];
  form: FormGroup;
  editMode = signal(false);

  columns = [
    { key: 'id_proveedor', label: 'N°' },
    { key: 'isActive', label: 'Estado' },
    { key: 'nombre', label: 'Nombre de Proveedor' },
    { key: 'nit_ci', label: 'NIT/CI' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'departamento', label: 'Departamento' },
  ];

  total = signal(0);
  pageSize = signal(10);
  currentPage = signal(1);
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  _notificationService = inject(NotificationService);
  constructor(private proveedorService: ProveedorService, private fb: FormBuilder) {
    this.departments = departamentos.departamentos;

    this.form = this.fb.group({
      nombre: ['', Validators.required],
      nit_ci: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      departamento: ['', Validators.required],
    });

    this.loadProveedores();
  }

  loadProveedores() {
    this.proveedorService.getAll(this.currentPage(), this.pageSize()).subscribe((res) => {
      console.log(res);
      this.proveedores.set(res.data);
      this.total.set(res.total);

      if (this.sortColumn()) this.ordenarProveedores();
    });
  }
  filteredProveedores = computed(() => {
    let arr = this.proveedores();

    const term = (this.searchTerm() ?? '').toLowerCase();
    if (!term) return arr;

    return arr.filter((p) => {
      const per = p.persona || {};
      return (
        (per.nombre || '').toLowerCase().includes(term) ||
        (per.nit_ci || '').toLowerCase().includes(term) ||
        (per.telefono || '').toLowerCase().includes(term) ||
        (per.direccion || '').toLowerCase().includes(term)
      );
    });
  });

  submit() {
    if (this.form.invalid) return;

    const data = this.form.value;

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.proveedorService.update(id, data).subscribe({
          next: () => {
            this._notificationService.showSuccess(`Se ha actualizado al proveedor`);
            this.loadProveedores();
            this.cancelEdit();
          },
          error: (error) => {
            this._notificationService.showError(`Error al actualizar cliente: ${error}`);
          },
        });
      }
    } else {
      this.proveedorService.create(data).subscribe({
        next: () => {
          this._notificationService.showSuccess(`Se ha creado al proveedor ${data.nombre}`);
          this.loadProveedores();
          this.cancelEdit();
        },
        error: (error) => {
          const msg = error.error?.message || 'Error al crear proveedor';
          this._notificationService.showError(msg);
        },
      });
    }
  }

  edit(proveedor: ProveedorDto) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.editId.set(proveedor.id_proveedor!);

    const per = proveedor.persona || {};

    this.form.patchValue({
      nombre: per.nombre || '',
      nit_ci: per.nit_ci || '',
      telefono: per.telefono || '',
      direccion: per.direccion || '',
      departamento: proveedor.departamento || '',
    });
  }

  openModal() {
    this.showModal.set(true);
    this.editMode.set(false);
    this.form.reset();
  }


  cancelEdit() {
    this.showModal.set(false);
    this.editMode.set(false);
    this.editId.set(null);
    this.form.reset();
  }

  delete(data: any) {
    this._notificationService
      .confirmDelete(`Se eliminará al proveedor ${data.persona.nombre}`)
      .then((result) => {
        if (result.isConfirmed) {
          this._notificationService.showSuccess('Eliminado correctamente');
          this.proveedorService.delete(data.id_proveedor).subscribe(() => this.loadProveedores());
        }
      });
  }

  ordenarProveedores() {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return;

    const arr = [...this.proveedores()];

    arr.sort((a, b) => {
      const valA = a[col as keyof ProveedorDto];
      const valB = b[col as keyof ProveedorDto];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return dir === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });

    this.proveedores.set(arr);
  }
  sort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    this.ordenarProveedores();
  }
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.loadProveedores();
    }
  }
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.loadProveedores();
    }
  }
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProveedores();
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
  downloadExcel(){

  }
downloadPDFProveedores() {
  try {
    const proveedores = this.filteredProveedores(); // Método que filtra proveedores según tu lógica
    if (proveedores.length === 0) {
      this._notificationService.showAlert('No hay proveedores para generar el PDF');
      return;
    }

    this.pdfService.downloadTablePdf({
      title: 'Sistema Ventas Carnes A&E',
      subtitle: 'Lista de Proveedores',
      columns: [
        { header: 'N°', dataKey: 'numero', width: 30, alignment: 'center' },
        { header: 'ID', dataKey: 'id_proveedor', width: 40, alignment: 'center' },
        { header: 'Nombre', dataKey: 'nombre', width: '*', alignment: 'left' },
        { header: 'NIT/CI', dataKey: 'nit_ci', width: 70, alignment: 'center' },
        { header: 'Teléfono', dataKey: 'telefono', width: 70, alignment: 'center' },
        { header: 'Dirección', dataKey: 'direccion', width: 120, alignment: 'left' },
        { header: 'Departamento', dataKey: 'departamento', width: 70, alignment: 'center' },
      ],
      data: proveedores.map((p, index) => ({
        numero: index + 1,
        id_proveedor: p.id_proveedor || 'N/A',
        nombre: p.persona?.nombre || 'N/A',
        nit_ci: p.persona?.nit_ci || 'N/A',
        telefono: p.persona?.telefono || 'N/A',
        direccion: p.persona?.direccion || 'N/A',
        departamento: p.departamento || 'N/A',
      })),
      fileName: 'Proveedores',
      pageOrientation: 'landscape',
      showFooter: true,
      footerText: 'Distribuidora A-E - Sistema de Gestión',
    });

    this._notificationService.showSuccess('PDF de proveedores generado correctamente');
  } catch (error) {
    console.error('Error en downloadPDFProveedores:', error);
    this._notificationService.showError('Error al generar el PDF de proveedores');
  }
}
downloadExcelProveedores() {
  try {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Proveedores');

    worksheet.columns = [
      { header: 'N°', key: 'numero', width: 8 },
      { header: 'ID Proveedor', key: 'id_proveedor', width: 12 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'NIT/CI', key: 'nit_ci', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Dirección', key: 'direccion', width: 40 },
      { header: 'Departamento', key: 'departamento', width: 25 },
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

    const proveedores =this.filteredProveedores(); // Método para filtrar proveedores

    proveedores.forEach((proveedor, index) => {
      if (!proveedor) return;

      const p = proveedor.persona || {};

      const row = worksheet.addRow({
        numero: index + 1,
        id_proveedor: proveedor.id_proveedor || 'N/A',
        nombre: p.nombre || 'N/A',
        nit_ci: p.nit_ci || 'N/A',
        telefono: p.telefono || 'N/A',
        direccion: p.direccion || 'N/A',
        departamento: proveedor.departamento || 'N/A',
      });

      row.getCell('numero').alignment = { vertical: 'middle', horizontal: 'center' };

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

    // Fila total
    const totalRow = worksheet.addRow({
      numero: '',
      id_proveedor: '',
      nombre: `Total de proveedores: ${proveedores.length}`,
      nit_ci: '',
      telefono: '',
      direccion: '',
      departamento: new Date().toLocaleDateString('es-BO'),
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
        saveAs(blob, `Proveedores_${fecha}.xlsx`);
        this._notificationService.showSuccess('Excel de proveedores generado correctamente');
      })
      .catch((error) => {
        console.error('Error generando Excel:', error);
        this._notificationService.showError('Error al generar el Excel de proveedores');
      });
  } catch (error) {
    console.error('Error en downloadExcelProveedores:', error);
    this._notificationService.showError('Error al generar el archivo Excel de proveedores');
  }
}

}

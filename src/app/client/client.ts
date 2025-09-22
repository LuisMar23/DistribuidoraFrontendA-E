import { Component, computed, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faUser, faUsers, faEye, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ClientService } from '../core/services/client.service';
import { CommonModule } from '@angular/common';
import { ClientDto } from '../core/interfaces/client.interface';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './client.html',
  styleUrls: ['./client.css'],
})
export class ClientComponent {
  faUser = faUser;
  faUsers = faUsers;
  faEye = faEye;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;

  clients = signal<ClientDto[]>([]);
  editId = signal<number | null>(null);
  searchTerm = signal('');
  showModal = signal(false);
  form: FormGroup;
  editMode = signal(false);

  total = signal(0);
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<keyof ClientDto>('creado_en');
  sortDirection = signal<'asc' | 'desc'>('desc');

  constructor(private clientService: ClientService, private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      nit_ci: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
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
    // filter
    let filtered = this.clients().filter(
      (c) =>
        (c.nombre || '').toLowerCase().includes(term) ||
        (c.nit_ci || '').toLowerCase().includes(term) ||
        (c.telefono || '').toLowerCase().includes(term) ||
        (c.direccion || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term)
    );

    // sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    filtered.sort((a: any, b: any) => {
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (av === bv) return 0;
      if (dir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

    // paginate
    const start = (this.currentPage() - 1) * this.pageSize();
    return filtered.slice(start, start + this.pageSize());
  });

  submit() {
    if (this.form.invalid) {
      console.log('Formulario inválido');
      return;
    }

    const data = this.form.value;

    if (this.editMode()) {
      const id = this.editId();
      if (id != null) {
        this.clientService.update(id, data).subscribe({
          next: (result) => {
            console.log('Cliente actualizado:', result);
            this.loadClients();
            this.cancelEdit();
          },
          error: (error) => {
            console.error('Error al actualizar cliente:', error);
            alert('Error al actualizar el cliente. Verifica la consola para más detalles.');
          }
        });
      }
    } else {
      this.clientService.create(data).subscribe({
        next: (result) => {
          console.log('Cliente creado:', result);
          this.loadClients();
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error al crear cliente:', error);
          alert('Error al crear el cliente. Verifica la consola para más detalles.');
        }
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
      email: client.email
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
      email: ''
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
      email: ''
    });
  }

  delete(id: number) {
    if (confirm('¿Desea eliminar este cliente?')) {
      this.clientService.delete(id).subscribe({
        next: () => {
          this.loadClients();
          console.log('Cliente eliminado correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar cliente:', error);
          alert('Error al eliminar el cliente. Verifica la consola para más detalles.');
        }
      });
    }
  }

  view(c: ClientDto) {
    console.log('Ver cliente:', c);
  }

  sort(column: keyof ClientDto) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
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

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
}

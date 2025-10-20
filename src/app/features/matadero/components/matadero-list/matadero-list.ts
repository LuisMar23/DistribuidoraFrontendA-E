import { Component, inject, signal, computed, effect, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  faSearch,
  faBox,
  faBoxOpen,
  faPenToSquare,
  faTrash,
  faEye,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { MataderoService } from '../../services/matadero.service';
import { Matadero } from '../../../../core/interfaces/matadero.interface';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-matadero',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './matadero-list.html',
})
export class MataderoComponent {
  private fb = inject(FormBuilder);
  private service = inject(MataderoService);

  // Íconos FontAwesome
  faSearch = faSearch;
  faBox = faBox;
  faBoxOpen = faBoxOpen;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faEye = faEye;
  faPlus = faPlus;

  id = input.required<number, string>({
    transform: (value: string) => parseInt(value, 10),
  });
  compraId = computed(() => this.id());

  mataderos = signal<Matadero[]>([]);
  searchTerm = signal('');
  showModal = signal(false);
  editMode = signal(false);
  selectedId = signal<number | null>(null);
  codigo = signal<String|null>(null);
  currentPage = signal(1);
  itemsPerPage = 10;

  private notificationService=inject(NotificationService)
  total = computed(() => this.filteredMataderos().length);
  totalPages = computed(() => Math.ceil(this.total() / this.itemsPerPage));
  rangeStart = computed(() => (this.currentPage() - 1) * this.itemsPerPage + 1);
  rangeEnd = computed(() => Math.min(this.currentPage() * this.itemsPerPage, this.total()));
  columns = [
    { key: 'id', label: '#' },
    { key: 'fechaFaena', label: 'Fecha Faena' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'tipoRes', label: 'Tipo Res' },
    { key: 'tipoIngreso', label: 'Tipo Ingreso' },
    { key: 'totalKilos', label: 'Total Kilos' },
  ];

  form: FormGroup = this.fb.group({
    cantidad: [null, [Validators.required]],
    fechaFaena: [null, [Validators.required]],
    tipoRes: ['', [Validators.required]],
    tipoIngreso: [''],
    observaciones: [''],
    totalKilos: [null, [Validators.required]],
    compraId: [null],
  });

  constructor() {
    this.loadMataderos();
    effect(() => {
      console.log('ID cambió:', this.compraId());
    });
  }

  loadMataderos() {
    this.service.findAll().subscribe({
      next: (res) => {
       const firstCodigo = res[0]?.compra?.codigo ?? '';
        this.codigo.set(firstCodigo)
        console.log(res)
        this.mataderos.set(res)
      }
    });
  }

  filteredMataderos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.mataderos().filter((m) => m.tipoRes.toLowerCase().includes(term));
  });

  paginatedMataderos = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredMataderos().slice(start, start + this.itemsPerPage);
  });


  pageArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update((p) => p - 1);
  }
  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update((p) => p + 1);
  }
  goToPage(i: number) {
    this.currentPage.set(i);
  }

  openModal() {
    this.showModal.set(true);
    this.form.reset();
    this.editMode.set(false);
  }

  edit(m: Matadero) {
    this.showModal.set(true);
    this.editMode.set(true);
    this.selectedId.set(m.id);
    this.form.patchValue(m);
  }

  cancelEdit() {
    this.showModal.set(false);
    this.form.reset();
    this.editMode.set(false);
    this.selectedId.set(null);
  }

  submit() {
    if (this.form.invalid) return;
    const fechaFaena = new Date(this.form.value.fechaFaena);
    this.form.get('fechaFaena')?.setValue(fechaFaena);
    this.form.get('compraId')?.setValue(this.compraId());
    const data = this.form.value;
    if (this.editMode()) {
      this.service.update(this.selectedId()!, data).subscribe({
        next: () => {
          this.notificationService.showSuccess(`Se ha actualizado correctamente`)
          this.loadMataderos();
          this.cancelEdit();
        },
      });
    } else {

      this.service.create(data).subscribe({
        next: () => {
          this.notificationService.showSuccess("Se ha creado correctamente el registro :)")
          this.loadMataderos();
          this.cancelEdit();
        },
      });
    }
  }

  delete(m: Matadero) {
    this.notificationService.confirmDelete(`¿Eliminar registro del matadero ${m.id}?`).then((result)=>{
      if (result.isConfirmed) {
        this.notificationService.showSuccess('Eliminado Correctamente')
        this.service.delete(m.id).subscribe(()=>this.loadMataderos())
      }
    })
  }
}

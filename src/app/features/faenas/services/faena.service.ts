// faena.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateFaenaDto } from '../../../core/interfaces/faena.interface';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class FaenaService {
  private apiUrl = environment.apiUrl;

  // Signal para mantener la lista reactiva
  faenas = signal<CreateFaenaDto[]>([]);

  constructor(private http: HttpClient) {}

  // Listar todas las faenas
  list(): Observable<CreateFaenaDto[]> {
    return new Observable((observer) => {
      this.http.get<CreateFaenaDto[]>(this.apiUrl).subscribe({
        next: (res) => {
          this.faenas.set(res);
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  // Obtener faena por ID
  getById(id: number): Observable<CreateFaenaDto> {
    return this.http.get<CreateFaenaDto>(`${this.apiUrl}/${id}`);
  }

  // Crear una faena
  create(dto: CreateFaenaDto): Observable<CreateFaenaDto> {
    return new Observable((observer) => {
      this.http.post<CreateFaenaDto>(this.apiUrl, dto).subscribe({
        next: (res) => {
          this.faenas.update((current) => [...current, res]);
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  // Actualizar una faena
  update(id: number, dto: any): Observable<CreateFaenaDto> {
    return this.http.put<CreateFaenaDto>(`${this.apiUrl}/${id}`, dto);
  }

  // Eliminar una faena
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

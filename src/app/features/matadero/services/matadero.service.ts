import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Matadero } from '../../../core/interfaces/matadero.interface';

@Injectable({ providedIn: 'root' })
export class MataderoService {
  private apiUrl = `${environment.apiUrl}/matadero`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Matadero[]> {
    return this.http.get<Matadero[]>(this.apiUrl);
  }

  create(data: Partial<Matadero>): Observable<Matadero> {
    return this.http.post<Matadero>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Matadero>): Observable<Matadero> {
    return this.http.patch<Matadero>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

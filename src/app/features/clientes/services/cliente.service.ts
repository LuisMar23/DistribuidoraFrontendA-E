import { Injectable } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  apiUrl = `${environment.apiUrl}/client`;

  constructor(private http: HttpClient) {}

  getAll(
    page: number = 1,
    pageSize: number = 5,
    sortColumn: string = 'creado_en',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<ClientDto[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortColumn', sortColumn)
      .set('sortDirection', sortDirection);

    return this.http.get<ClientDto[]>(this.apiUrl, {
      params,
    });
  }

  getById(id: number): Observable<ClientDto> {
    return this.http.get<ClientDto>(`${this.apiUrl}/${id}`);
  }

  create(client: Partial<ClientDto>): Observable<ClientDto> {
    return this.http.post<ClientDto>(this.apiUrl, client);
  }

  update(id: number, client: Partial<ClientDto>): Observable<ClientDto> {
    return this.http.patch<ClientDto>(`${this.apiUrl}/${id}`, client);
  }

  delete(id: number): Observable<ClientDto> {
    return this.http.delete<ClientDto>(`${this.apiUrl}/${id}`);
  }
}

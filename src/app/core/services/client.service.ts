import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClientDto } from '../interfaces/client.interface';

@Injectable({
providedIn: 'root',
})
export class ClientService {
apiUrl = `${environment.apiUrl}/client`;

constructor(private http: HttpClient) {}

getAll(): Observable<ClientDto[]> {
return this.http.get<ClientDto[]>(this.apiUrl);
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

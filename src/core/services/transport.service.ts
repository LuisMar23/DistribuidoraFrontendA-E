import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TransportDto {
id_transporte: number;
id_compra: number;
transportista: string;
vehiculo: string;
costo_local: number;
costo_departamental: number;
fecha_salida: string;
fecha_llegada: string;
estado: 'en_camino' | 'recibido' | 'cancelado';
}

@Injectable({
providedIn: 'root',
})
export class TransportService {
apiUrl = `${environment.apiUrl}/transport`;

    constructor(private http: HttpClient) {}

getAll(): Observable<TransportDto[]> {
    return this.http.get<TransportDto[]>(this.apiUrl);
    }

getById(id: number): Observable<TransportDto> {
    return this.http.get<TransportDto>(`${this.apiUrl}/${id}`);
    }

create(transport: Partial<TransportDto>): Observable<TransportDto> {
    return this.http.post<TransportDto>(this.apiUrl, transport);
    }

update(id: number, transport: Partial<TransportDto>): Observable<TransportDto> {
    return this.http.patch<TransportDto>(`${this.apiUrl}/${id}`, transport);
    }

delete(id: number): Observable<TransportDto> {
    return this.http.delete<TransportDto>(`${this.apiUrl}/${id}`);
    }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCompraDto } from '../../../core/interfaces/compra.interface';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class CompraService {
  private baseUrl = environment.apiUrl + '/compras'
  private http=inject(HttpClient)


  create(compra: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, compra);
  }

getAll(page: number = 1, pageSize: number = 10): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
}


  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  update(id: number, compra: Partial<CreateCompraDto>): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}`, compra);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}

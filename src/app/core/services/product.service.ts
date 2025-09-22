import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductDto } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  apiUrl = `${environment.apiUrl}/product`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.apiUrl}/${id}`);
  }

  create(product: Partial<ProductDto>): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.apiUrl, product);
  }

  update(id: number, product: Partial<ProductDto>): Observable<ProductDto> {
    return this.http.patch<ProductDto>(`${this.apiUrl}/${id}`, product);
  }

  delete(id: number): Observable<ProductDto> {
    return this.http.delete<ProductDto>(`${this.apiUrl}/${id}`);
  }
}

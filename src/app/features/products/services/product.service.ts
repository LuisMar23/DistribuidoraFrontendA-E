import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { ProductDto } from "../../../core/interfaces/product.interface";
import { Observable } from "rxjs";




@Injectable({providedIn:'root'})
export class ProductService{

    private http=inject(HttpClient)
    private apiUrl=environment.apiUrl + '/product'
  products = signal<ProductDto[]>([]);

   list(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.apiUrl}/${id}`);
  }

  create(data: ProductDto): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.apiUrl, data);
  }

  update(id: number, data: Partial<ProductDto>): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }



}
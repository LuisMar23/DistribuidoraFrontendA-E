import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PagoService {
  private apiUrl = environment.apiUrl +'/pagos';
  constructor(private http: HttpClient) {}
   getAll():Observable<any>{
     return this.http.get<any>(`${this.apiUrl}`);
   }
}

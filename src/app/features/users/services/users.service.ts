import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserDto } from '../../../core/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  updateProfile(id: number, data: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${id}`, data);
  }
 getProfile(): Observable<any> {
  return this.http.get(`${this.apiUrl}/users/profile`);
}

  getAvatar(id: number): string {
    return `${this.apiUrl}/users/${id}/avatar`;
  }

 deleteAvatar(): Observable<any> {
  return this.http.delete(`${this.apiUrl}/users/profile/avatar`);
}


  updateRole(id: number, newRole: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/role`, { id, newRole });
  }

  getAll(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }
  
}

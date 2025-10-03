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

  // Actualizar perfil (datos importantes + avatar)
  updateProfile(id: number, data: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${id}`, data);
  }

  // Obtener perfil de usuario
 getProfile(): Observable<any> {
  return this.http.get(`${this.apiUrl}/users/profile`);
}
  // Obtener avatar del usuario (archivo binario o URL)
  getAvatar(id: number): string {
    return `${this.apiUrl}/users/${id}/avatar`;
  }

  // Eliminar avatar
 deleteAvatar(): Observable<any> {
  return this.http.delete(`${this.apiUrl}/users/profile/avatar`);
}


  // Actualizar rol (tuya existente)
  updateRole(id: number, newRole: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users`, { id, newRole });
  }

  // Obtener todos los usuarios (tuya existente)
  getAll(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`);
  }

  // Eliminar usuario (tuya existente)
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }
  
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environ/environ';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  register_date: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
  password?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileUrl = `${environment.apiUrl}users/profile/`; 
  private uploadUrl = `${environment.apiUrl}users/upload-profile-picture/`;

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Verificar si estamos en el navegador
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Obtener headers de autenticación 
  private getAuthHeaders(isFormData: boolean = false): HttpHeaders {
    if (!this.isBrowser()) {
      return new HttpHeaders(); // No usar localStorage si estamos en SSR
    }

    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    if (!token) return new HttpHeaders();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return isFormData ? headers : headers.set('Content-Type', 'application/json');
  }

  // Obtener información del perfil del usuario
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.profileUrl, { headers: this.getAuthHeaders() }).pipe(
      tap(profile => this.currentUserSubject.next(profile)), 
      catchError((error) => {
        console.error("❌ Error fetching user profile:", error);
        return throwError(() => new Error("Failed to load user profile."));
      })
    );
  }

  // Subir imagen de perfil
  uploadProfilePicture(formData: FormData): Observable<any> {
    return this.http.post(this.uploadUrl, formData, { 
      headers: this.getAuthHeaders(true) 
    }).pipe(
      tap(() => {
        // Imagen subida correctamente
      })
    );
  }

  // Actualizar perfil
  updateUserProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    const url = `${this.profileUrl}update-profile/`;
    return this.http.put<UserProfile>(url, profileData, { headers: this.getAuthHeaders() });
  }

  setCurrentUser(user: UserProfile) {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }
}

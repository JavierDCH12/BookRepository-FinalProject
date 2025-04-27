import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environ/environ';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  date_joined: string;
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

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.profileUrl).pipe(
      tap(profile => this.currentUserSubject.next(profile)),
      catchError((error) => {
        console.error("❌ Error al cargar el perfil de usuario:", error);
        return throwError(() => new Error("No se pudo cargar el perfil de usuario."));
      })
    );
  }

  updateUserProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.profileUrl, profileData).pipe(
      tap(profile => this.currentUserSubject.next(profile)),
      catchError((error) => {
        console.error('❌ Error al actualizar el perfil:', error);
        return throwError(() => new Error('No se pudo actualizar el perfil.'));
      })
    );
  }

  setCurrentUser(user: UserProfile): void {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  clearUserProfile(): void {
    this.currentUserSubject.next(null);
  }
}

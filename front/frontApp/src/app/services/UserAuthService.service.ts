import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environ/environ';
import { LOCAL_STORAGE_KEYS, NAVIGATION_ROUTES } from '../utils/constants';
import { Router } from '@angular/router';
import { ProfileService } from './ProfileService.service';

interface LoginResponse {
  access: string;
  refresh: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserAuthServiceService {
  private baseUrl = environment.apiUrl;
  private loginSuccessSourceAddBook = new Subject<void>();
  loginSuccessSourceAddBook$ = this.loginSuccessSourceAddBook.asObservable();

  private authStatus = new BehaviorSubject<boolean>(this.hasValidToken());
  authStatus$ = this.authStatus.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private profileService: ProfileService
  ) {}

  private hasValidToken(): boolean {
    if (typeof window === 'undefined') return false; 
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    return token ? !this.isTokenExpired(token) : false;
  }

  registerUser(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}users/register/`, { username, email, password }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(
          error.error?.username?.[0] ||
          error.error?.email?.[0] ||
          error.error?.password?.[0] ||
          'Error en el registro.'
        ));
      })
    );
  }

  loginUser(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}users/login/`, { username, password }).pipe(
      tap((response) => {
        this.clearStorage();                  // 🔥 BORRAMOS TODO antes de nada
        this.profileService.clearUserProfile(); // 🔥 Limpiar perfil
        this.storeTokens(response);             // Guardamos nuevo token limpio
        this.authStatus.next(true);             
        this.profileService.getUserProfile().subscribe(); // Recargar perfil correcto
        this.loginSuccessSourceAddBook.next();            
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.detail || 'Error en el inicio de sesión.'));
      })
    );
  }

  private storeTokens(data: LoginResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, data.access);
      localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH, data.refresh);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, data.username);
    }
  }

  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USERNAME);
      localStorage.removeItem('pendingFavoriteBook'); // 🔥 Limpiar pendientes también
      localStorage.removeItem('pendingWishlistBook'); // 🔥 Limpiar pendientes también
    }
  }

  refreshToken(): Observable<any> {
    if (typeof window === 'undefined') {
      return throwError(() => new Error('No hay token de refresco disponible.'));
    }
    const refresh = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH);
    if (!refresh) {
      return throwError(() => new Error('No hay token de refresco disponible.'));
    }

    return this.http.post<{ access: string }>(`${this.baseUrl}refresh/`, { refresh }).pipe(
      tap((response) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, response.access);
        }
      }),
      catchError(() => {
        this.logout(); // 🔥 Cierre total si falla refresh
        return throwError(() => new Error('Error al refrescar el token. Inicia sesión nuevamente.'));
      })
    );
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    return !!token && !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch {
      return true;
    }
  }

  logout(): void {
    this.clearStorage();                    
    this.profileService.clearUserProfile();   
    this.authStatus.next(false);            
    this.router.navigate([NAVIGATION_ROUTES.LOGIN]); 
  }
}

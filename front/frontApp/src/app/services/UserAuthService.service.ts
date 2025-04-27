import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, Subject, switchMap, tap, throwError } from 'rxjs';
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

  loginUser(username: string, password: string): Observable<any> {
    console.log('🛑 Enviando login para:', username);
  
    return this.http.post<LoginResponse>(`${this.baseUrl}users/login/`, { username, password }).pipe(
      tap((response) => {
        console.log('✅ LOGIN RESPONSE:', response);
        this.clearStorage();
        this.storeTokens(response);
        this.authStatus.next(true);
        console.log('📦 Nuevo token guardado:', localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN));
      }),
      switchMap(() => {
        console.log('⌛️ Esperando 1 tick para refrescar interceptor...');
        return of(null); 
      }),
      switchMap(() => {
        console.log('🔎 Solicitando perfil con token actualizado...');
        return this.profileService.getUserProfile().pipe(
          tap((profile) => {
            console.log('👤 Perfil cargado tras login:', profile);
            this.profileService.setCurrentUser(profile);
            this.loginSuccessSourceAddBook.next();
          })
        );
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
      localStorage.removeItem('pendingFavoriteBook'); // También eliminar cualquier libro pendiente
      localStorage.removeItem('pendingWishlistBook');
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
        this.logout();
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
    this.clearStorage();                     // Borrar todos los tokens y username
    this.profileService.clearUserProfile();   // Limpiar perfil actual
    this.authStatus.next(false);              // Emitir desautenticado
    this.router.navigate([NAVIGATION_ROUTES.LOGIN]); // Redirigir a login
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environ/environ';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

@Injectable({
  providedIn: 'root'
})
export class UserAuthServiceService {
  private baseUrl = environment.apiUrl;
  private loginSuccessSourceAddBook = new Subject<void>();
  loginSuccessSourceAddBook$ = this.loginSuccessSourceAddBook.asObservable();

  // Estado de autenticación
  private authStatus = new BehaviorSubject<boolean>(this.hasValidToken());
  authStatus$ = this.authStatus.asObservable();

  constructor(private http: HttpClient) {}

  
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
    return this.http.post(`${this.baseUrl}users/login/`, { username, password }).pipe(
      tap((response: any) => {
        this.storeTokens(response.access, response.refresh, username);
        this.authStatus.next(true);
        this.loginSuccessSourceAddBook.next();
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.detail || 'Error en el inicio de sesión.'));
      })
    );
  }

  private storeTokens(access: string, refresh: string, username: string): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, access);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH, refresh);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, username);
  }

  refreshToken(): Observable<any> {
    const refresh = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH);
    if (!refresh) {
      return throwError(() => new Error('No hay token de refresco disponible.'));
    }

    return this.http.post(`${this.baseUrl}refresh/`, { refresh }).pipe(
      tap((response: any) => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, response.access);
      }),
      catchError(() => {
        this.logout();
        return throwError(() => new Error('Error al refrescar el token. Inicia sesión nuevamente.'));
      })
    );
  }

  isAuthenticated(): boolean {
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
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USERNAME);
    this.authStatus.next(false);
  }
}

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

  // Estado  de autenticación 
  private authStatus = new BehaviorSubject<boolean>(this.hasValidToken());
  authStatus$ = this.authStatus.asObservable(); // Se puede suscribir a cambios para mostrarlo en otros componentes

  constructor(private http: HttpClient) {}

  // Verificar si hay un token válido 
  private hasValidToken(): boolean {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    return token ? !this.isTokenExpired(token) : false;
  }

  // Registrar usuario
  registerUser(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}users/register/`, { username, email, password }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Registration error:', error);
        return throwError(() => new Error(
          error.error?.username?.[0] ||
          error.error?.email?.[0] ||
          error.error?.password?.[0] ||
          'Error en el registro.'
        ));
      })
    );
  }

  // Login de usuario
  loginUser(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}users/login/`, { username, password }).pipe(
      tap((response: any) => {
        this.storeTokens(response.access, response.refresh, username);
        this.authStatus.next(true); 
        this.loginSuccessSourceAddBook.next();
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login error:', error);
        return throwError(() => new Error(error.error?.detail || 'Error en el inicio de sesión.'));
      })
    );
  }

  // Almacenar tokens en localStorage
  private storeTokens(access: string, refresh: string, username: string): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, access);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH, refresh);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, username);
  }

  // Refrescar token
  refreshToken(): Observable<any> {
    const refresh = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH);
    if (!refresh) {
      return throwError(() => new Error('No hay token de refresco disponible.'));
    }
    return this.http.post(`${this.baseUrl}refresh/`, { refresh }).pipe(
      tap((response: any) => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, response.access);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Refresh token error:', error);
        this.logout();
        return throwError(() => new Error('Error al refrescar el token. Inicia sesión nuevamente.'));
      })
    );
  }

  // Verificar si el usuario está autenticado
isAuthenticated(): boolean {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
  console.log("🔍 Estado autenticación:", !!token && !this.isTokenExpired(token)); 
  return !!token && !this.isTokenExpired(token);
}


  // Verificar si el token ha expirado
  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const now = Math.floor(new Date().getTime() / 1000);
      return decoded.exp < now;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return true;
    }
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USERNAME);
    this.authStatus.next(false); //  Notificamos que ha cerrado sesión
  }
}

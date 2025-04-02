import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environ/environ';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';
import { catchError } from 'rxjs/operators';

export interface FavoriteBook {
  book_key: string;
  title: string;
  author?: string;
  isbn?: string;
  genres?: string[] | string;
  first_publish_year?: number;
  cover_url?: string;
  review?: string;
  rating: number;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private favoritesUrl = `${environment.apiUrl}users/favorites/`;

  constructor(private http: HttpClient) {}

  // Obtener encabezados con token para la autenticación 
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    
    if (!token) {
      console.error('❌ No token found in localStorage.');
      return new HttpHeaders();
    }

    console.log("📡 Enviando headers con token:", token);

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener libros favoritos
  getFavorites(): Observable<FavoriteBook[]> {
    return this.http.get<FavoriteBook[]>(this.favoritesUrl, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Agregar libro a favoritos 
  addFavorite(book: FavoriteBook): Observable<any> {
    const formattedBook = {
      book_key: book.book_key,
      title: book.title,
      author: book.author || '',
      isbn: book.isbn || undefined,
      genres: Array.isArray(book.genres) ? book.genres.join(', ') : book.genres || '',
      first_publish_year: book.first_publish_year || undefined,
      cover_url: book.cover_url || '',
      review: book.review || '',
      rating: book.rating || 0
    };

    console.log("📡 Enviando libro a favoritos:", formattedBook);

    return this.http.post<any>(this.favoritesUrl, formattedBook, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Eliminar favorito 
  removeFavorite(bookKey: string): Observable<void> {
    return this.http.delete<void>(`${this.favoritesUrl}${bookKey}/`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }
  // Metodo para la recomendación de libros populares

  getPopularBooks(): Observable<FavoriteBook[]> {
    return this.http.get<FavoriteBook[]>(`${environment.apiUrl}books/popular/`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Crear o actualizar reseña
  manageReview(bookKey: string, review: string): Observable<any> {
    return this.http.patch(`${this.favoritesUrl}${bookKey}/review/`, { review }, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Actualizar la valoración 
  updateRating(bookKey: string, rating: number): Observable<any> {
    return this.http.patch(`${this.favoritesUrl}${bookKey}/rating/`, { rating }, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores globales
  private handleError(error: any) {
    console.error('❌ Error en la solicitud:', error);
    return throwError(() => new Error(error.message || 'Ha ocurrido un error en la solicitud.'));
  }
}

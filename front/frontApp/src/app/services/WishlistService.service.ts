import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environ/environ';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

export interface WishlistBook {
  book_key: string;
  title: string;
  author?: string;
  isbn?: string;
  genres?: string[];
  cover_url?: string;
  first_publish_year?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private baseUrl = `${environment.apiUrl}wishlist/`;

  constructor(private http: HttpClient) {}

  private wishlistCountSubject = new BehaviorSubject<number>(0);
wishlistCount$ = this.wishlistCountSubject.asObservable();


  // Obtener encabezados con token 
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    
    if (!token) {
      console.error('❌ No token found in localStorage.');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener libros en la wishlist
  getWishlist(): Observable<WishlistBook[]> {
    return this.http.get<WishlistBook[]>(this.baseUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Añadir libro a la wishlist 
  addToWishlist(book: WishlistBook): Observable<WishlistBook> {
    const formattedBook = {
      book_key: book.book_key,
      title: book.title,
      author: book.author || '',
      isbn: book.isbn || undefined,
      genres: Array.isArray(book.genres) ? book.genres.join(', ') : '',
      cover_url: book.cover_url || '',
      first_publish_year: book.first_publish_year || undefined
    };

    return this.http.post<WishlistBook>(this.baseUrl, formattedBook, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar libro de la wishlist 
  removeFromWishlist(bookKey: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}${bookKey}/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Manejo de errores 
  private handleError(error: any) {
    console.error('❌ Error en wishlist:', error);
    return throwError(() => new Error(error.message || 'Ha ocurrido un error en WishlistService.'));
  }
}

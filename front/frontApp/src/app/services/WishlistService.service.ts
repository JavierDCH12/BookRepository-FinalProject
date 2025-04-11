import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environ/environ';

export interface WishlistBook {
  book_key: string;
  title: string;
  author?: string;
  isbn?: string;
  genres?: string[] | string;
  cover_url?: string;
  first_publish_year?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private baseUrl = `${environment.apiUrl}wishlist/`;

  private wishlistSubject = new BehaviorSubject<WishlistBook[]>([]);
  wishlist$ = this.wishlistSubject.asObservable();

  private wishlistCountSubject = new BehaviorSubject<number>(0);
  wishlistCount$ = this.wishlistCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 🔄 Recargar wishlist desde backend
  loadWishlist(): void {
    this.http.get<WishlistBook[]>(this.baseUrl).pipe(
      tap((wishlist) => {
        this.wishlistSubject.next(wishlist);
        this.wishlistCountSubject.next(wishlist.length);
      }),
      catchError(this.handleError)
    ).subscribe(); // ejecuta sin necesidad de que lo hagan desde fuera
  }

  // 🆕 Añadir libro
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

    return this.http.post<WishlistBook>(this.baseUrl, formattedBook).pipe(
      tap(() => this.loadWishlist()), // ← recarga tras añadir
      catchError(this.handleError)
    );
  }

  // ❌ Eliminar libro
  removeFromWishlist(bookKey: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}${bookKey}/`).pipe(
      tap(() => this.loadWishlist()), // ← recarga tras eliminar
      catchError(this.handleError)
    );
  }

  // ❗ Error handler
  private handleError(error: any) {
    return throwError(() => new Error(error.message || 'Ha ocurrido un error en la wishlist.'));
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environ/environ';

export interface WishlistBook {
  book_key: string;
  title: string;
  author: string;
  isbn?: string;
  genres?: string[];
  cover_url?: string;
  first_publish_year?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private baseUrl = `${environment.apiUrl}wishlist`;
  private wishlistSubject = new BehaviorSubject<WishlistBook[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Cargar wishlist desde el backend y actualizar el observable.
   */
  loadWishlist(): Observable<WishlistBook[]> {
    return this.http.get<WishlistBook[]>(this.baseUrl).pipe(
      tap((wishlist: WishlistBook[]) => {
        this.wishlistSubject.next(wishlist);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Añadir un libro a la wishlist.
   */
  addToWishlist(book: WishlistBook): Observable<WishlistBook> {
    return this.http.post<WishlistBook>(this.baseUrl, book).pipe(
      tap(() => {
        this.loadWishlist().subscribe(); // recarga tras añadir
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar un libro de la wishlist.
   */
  removeFromWishlist(bookKey: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${bookKey}`).pipe(
      tap(() => {
        this.loadWishlist().subscribe(); // recarga tras eliminar
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores centralizado.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('WishlistService error:', error);
    return throwError(() => new Error('Ocurrió un error al gestionar la wishlist.'));
  }
}

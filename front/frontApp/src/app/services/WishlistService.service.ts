import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environ/environ';
import { of } from 'rxjs';

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

  public wishlistCount$ = this.wishlist$.pipe(
    map((wishlist) => wishlist.length)
  );

  constructor(private http: HttpClient) {}

  loadWishlist(): Observable<WishlistBook[]> {
    return this.http.get<WishlistBook[]>(this.baseUrl).pipe(
      tap((wishlist) => {
        this.wishlistSubject.next(wishlist);
      }),
      catchError(this.handleError)
    );
  }

  addToWishlist(book: WishlistBook): Observable<WishlistBook> {
    return this.http.post<WishlistBook>(this.baseUrl, book).pipe(
      tap(() => this.reloadWishlist()),
      catchError(this.handleError)
    );
  }

  removeFromWishlist(bookKey: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${bookKey}`).pipe(
      tap(() => this.reloadWishlist()),
      catchError(this.handleError)
    );
  }

  private reloadWishlist(): void {
    this.loadWishlist().subscribe();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('WishlistService error:', error);
    return throwError(() => new Error('Ocurrió un error al gestionar la wishlist.'));
  }

  processPendingWishlist(): Observable<any> {
    const json = localStorage.getItem('pendingWishlistBook');
  
    if (!json) {
      console.warn(' No hay libro pendiente en wishlist (localStorage vacío)');
      return of(null); 
    }
  
    const book: WishlistBook = JSON.parse(json);
    console.log(' Intentando añadir wishlist pendiente:', book);
  
    return this.addToWishlist(book).pipe(
      tap(() => {
        console.log(` Wishlist añadida tras login: ${book.title}`);
        localStorage.removeItem('pendingWishlistBook');
        this.loadWishlist(); 
      }),
      catchError((err) => {
        console.error(' Error al añadir wishlist pendiente:', err);
        return of(null); 
      })
    );
  }
  
  

  
}


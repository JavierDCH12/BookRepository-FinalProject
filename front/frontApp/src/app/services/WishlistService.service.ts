import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environ/environ';

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

  private wishlistCountSubject = new BehaviorSubject<number>(0);
  wishlistCount$ = this.wishlistCountSubject.asObservable();

  private currentWishlist: WishlistBook[] = [];

  constructor(private http: HttpClient) {}

  /** Obtener todos los libros en la wishlist */
  getWishlist(): Observable<WishlistBook[]> {
    return this.http.get<WishlistBook[]>(this.baseUrl).pipe(
      tap((books) => {
        this.currentWishlist = books;
        this.wishlistCountSubject.next(books.length);
      })
    );
  }

  /** Cargar la wishlist y actualizar el contador */
  loadWishlist(): void {
    this.getWishlist().subscribe(); // Solo dispara el efecto del tap
  }

  /** Añadir un libro a la wishlist */
  addToWishlist(book: WishlistBook): Observable<WishlistBook> {
    return this.http.post<WishlistBook>(this.baseUrl, book).pipe(
      tap(() => {
        this.currentWishlist.push(book);
        this.wishlistCountSubject.next(this.currentWishlist.length);
      })
    );
  }

  /** Eliminar un libro de la wishlist */
  removeFromWishlist(bookKey: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}${bookKey}/`).pipe(
      tap(() => {
        this.currentWishlist = this.currentWishlist.filter(b => b.book_key !== bookKey);
        this.wishlistCountSubject.next(this.currentWishlist.length);
      })
    );
  }
}

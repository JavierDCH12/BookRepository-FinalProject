import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environ/environ';

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

  private favoriteBooksSubject = new BehaviorSubject<FavoriteBook[]>([]);
  favoriteBooks$ = this.favoriteBooksSubject.asObservable();

  // ✅ Contador reactivo de favoritos
  public favoriteCount$ = this.favoriteBooks$.pipe(
    map(favs => favs.length)
  );

  constructor(private http: HttpClient) {}

  loadFavorites(): void {
    this.http.get<FavoriteBook[]>(this.favoritesUrl)
      .pipe(
        tap(favorites => this.favoriteBooksSubject.next(favorites)),
        catchError(this.handleError)
      )
      .subscribe();
  }

  getFavorites(): Observable<FavoriteBook[]> {
    return this.favoriteBooks$;
  }

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

    return this.http.post<any>(this.favoritesUrl, formattedBook).pipe(
      tap(() => this.loadFavorites()),
      catchError(this.handleError)
    );
  }

  removeFavorite(bookKey: string): Observable<void> {
    return this.http.delete<void>(`${this.favoritesUrl}${bookKey}/`).pipe(
      tap(() => {
        const current = this.favoriteBooksSubject.getValue();
        const updated = current.filter(book => book.book_key !== bookKey);
        this.favoriteBooksSubject.next(updated);
      }),
      catchError(error => {
        if (error.status === 404) {
          const current = this.favoriteBooksSubject.getValue();
          const updated = current.filter(book => book.book_key !== bookKey);
          this.favoriteBooksSubject.next(updated);
          return throwError(() => error);
        }
        return this.handleError(error);
      })
    );
  }
  

  getPopularBooks(): Observable<FavoriteBook[]> {
    return this.http.get<FavoriteBook[]>(`${environment.apiUrl}books/popular/`)
      .pipe(catchError(this.handleError));
  }

  manageReview(bookKey: string, review: string): Observable<any> {
    return this.http.patch(`${this.favoritesUrl}${bookKey}/review/`, { review })
      .pipe(
        tap(() => this.loadFavorites()),
        catchError(this.handleError)
      );
  }

  updateRating(bookKey: string, rating: number): Observable<any> {
    return this.http.patch(`${this.favoritesUrl}${bookKey}/rating/`, { rating })
      .pipe(
        tap(() => this.loadFavorites()),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }
}

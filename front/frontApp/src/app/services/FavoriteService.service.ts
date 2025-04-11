import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

  constructor(private http: HttpClient) {}

  // Obtener favoritos y actualizar el BehaviorSubject
  loadFavorites(): void {
    this.http.get<FavoriteBook[]>(this.favoritesUrl)
      .pipe(
        tap(favorites => this.favoriteBooksSubject.next(favorites)),
        catchError(this.handleError)
      )
      .subscribe(); // ejecutamos el observable
  }

  // Devolver favoritos actuales
  getFavorites(): Observable<FavoriteBook[]> {
    return this.favoriteBooks$;
  }

  // Añadir favorito y actualizar
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

  // Eliminar favorito y actualizar
  removeFavorite(bookKey: string): Observable<void> {
    return this.http.delete<void>(`${this.favoritesUrl}${bookKey}/`).pipe(
      tap(() => this.loadFavorites()),
      catchError(this.handleError)
    );
  }

  // Libros populares
  getPopularBooks(): Observable<FavoriteBook[]> {
    return this.http.get<FavoriteBook[]>(`${environment.apiUrl}books/popular/`)
      .pipe(catchError(this.handleError));
  }

  // Reseña
  manageReview(bookKey: string, review: string): Observable<any> {
    return this.http.patch(`${this.favoritesUrl}${bookKey}/review/`, { review })
      .pipe(
        tap(() => this.loadFavorites()),
        catchError(this.handleError)
      );
  }

  // Valoración
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

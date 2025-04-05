import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environ/environ';


export interface Book {
  title: string;
  author: string;
  genres?: string;
  first_publish_year?: number;
  isbn?: string;
  cover_url?: string;
  key: string;
  book_key: string;
  description?: string;
  review?: string;
}

export interface BookSearchResponse {
  books: Book[];
  total_count: number;
  total_pages: number;
  current_page: number;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private baseUrl = `${environment.apiUrl}books/search`; // La URL base para las búsquedas
  private openLibraryBaseUrl = 'https://openlibrary.org'; 

  constructor(private http: HttpClient) {}

  // Método para buscar libros
  searchBooks(title: string, author: string, genre: string, page: number = 1): Observable<any> {
    let params = new HttpParams();
    if (title) params = params.set('title', title);
    if (author) params = params.set('author', author);
    if (genre) params = params.set('genre', genre);

    params = params.set('page', page.toString());
    const perPage = 20;
    params = params.set('per_page', perPage.toString());

    return this.http.get<any>(`${this.baseUrl}`, { params }).pipe(
      map(response => {
        return {
          books: response.books,
          total_count: response.total_count,
          total_pages: response.total_pages,
          current_page: page,
        };
      }),
      catchError(error => {
        console.error('Error fetching books:', error);
        return throwError(() => new Error('Error fetching books'));
      })
    );
  }

  // Método para obtener los detalles de un libro
  getBookDetails(bookKey: string): Observable<Book> {
    return this.http.get<Book>(`${environment.apiUrl}books/details/${bookKey}`).pipe(
      tap(response => {}),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching book details:', error);
        return throwError(() => new Error('Error fetching book details'));
      })
    );
  }

  // Obtener descripción del libro desde OpenLibrary
  getBookDescription(bookKey: string): Observable<{ description: string }> {
    const descriptionUrl = `${this.openLibraryBaseUrl}/works/${bookKey}.json`;
    return this.http.get<{ description: string }>(descriptionUrl).pipe(
      map((response: any) => {
        const description = response.description || 'No description available.';
        return { description };
      }),
      catchError(error => {
        console.error('Error fetching book description:', error);
        return throwError(() => new Error('No description available.'));
      })
    );
  }
}


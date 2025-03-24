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
  book_key: string; 
  description?: string | null; 
}

export interface BookSearchResponse {
  books: Book[];
  total_count: number;
  total_pages: number;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private baseUrl = `${environment.apiUrl}books/search/`; // Aseguramos la URL correcta
  private openLibraryBaseUrl = 'https://openlibrary.org';

  constructor(private http: HttpClient) {}

  searchBooks(title: string, author: string, genre: string, page: number): Observable<BookSearchResponse> {
    let params = new HttpParams();
    if (title) params = params.set('title', title);
    if (author) params = params.set('author', author);
    if (genre) params = params.set('genre', genre);
    if (page) params = params.set('page', page.toString());

    console.log('📡 Requesting:', `${this.baseUrl}`, 'With Params:', params.toString());

    return this.http.get<BookSearchResponse>(`${this.baseUrl}`, { params }).pipe(
      map(response => {
        // Asegúrate de que los libros se procesen correctamente.
        return {
          books: response.books.map(book => ({
            ...book,
            book_key: book.book_key.replace('/works/', '') // Asegura el formato del book_key
          })),
          total_count: response.total_count,
          total_pages: response.total_pages
        };
      }),
      tap(response => console.log('📡 API Response in Angular:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('⚠️ API Error in Angular:', error);
        return throwError(() => new Error('Error fetching books'));
      })
    );
  }

  getBookDescription(book_key: string): Observable<{ description: string }> {
    const descriptionUrl = `${this.openLibraryBaseUrl}/works/${book_key}.json`; 
    console.log('📡 Fetching description from:', descriptionUrl);

    return this.http.get<{ description: string }>(descriptionUrl).pipe(
      map((response: any) => {
        if (response.description) {
          return { description: typeof response.description === 'string' ? response.description : response.description.value };
        } else {
          return { description: 'No description available.' };
        }
      }),
      catchError(error => {
        console.error('⚠️ Error fetching book description:', error);
        return throwError(() => new Error('No description available.'));
      })
    );
  }

  getBookDetails(book_key: string): Observable<Book> {
    const detailsUrl = `${this.openLibraryBaseUrl}/works/${book_key}.json`; 
    console.log('📡 Fetching book details from:', detailsUrl);

    return this.http.get<Book>(detailsUrl).pipe(
      map((response: any) => {
        return {
          title: response.title,
          author: response.authors.map((author: any) => author.name).join(', '),
          first_publish_year: response.first_publish_year,
          isbn: response.isbn || 'No ISBN available',
          cover_url: response.cover_id ? `https://covers.openlibrary.org/b/id/${response.cover_id}-L.jpg` : 'No cover available',
          book_key: book_key,
          genres: response.subjects || ['No genres available'],
          description: response.description ? response.description.value : 'No description available',
        };
      }),
      catchError(error => {
        console.error('⚠️ Error fetching book details:', error);
        return throwError(() => new Error('No details available.'));
      })
    );
  }


  



}

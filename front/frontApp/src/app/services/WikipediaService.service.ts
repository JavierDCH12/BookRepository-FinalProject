import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environ/environ'; 

@Injectable({
  providedIn: 'root'
})
export class WikipediaService {
  private backendWikipediaUrl = `${environment.apiUrl}wikipedia-link`; 

  constructor(private http: HttpClient) {}

  getWikipediaLink(author: string): Observable<string | null> {
    const encodedAuthor = encodeURIComponent(author);
    return this.http
      .get<{ link: string | null }>(`${this.backendWikipediaUrl}?author=${encodedAuthor}`)
      .pipe(map(response => response.link));
  }
}

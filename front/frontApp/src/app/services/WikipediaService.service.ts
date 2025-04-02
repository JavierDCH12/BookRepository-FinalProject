import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WikipediaService {
  private wikipediaApiUrl = 'https://en.wikipedia.org/w/api.php';

  constructor(private http: HttpClient) {}

  // Obtener enlace de Wikipedia de un autor concreto
  getWikipediaLink(author: string): Observable<string | null> {
    const params = {
      action: 'query',
      format: 'json',
      origin: '*',
      titles: author,
      prop: 'pageprops'
    };
  
    return this.http.get<any>(this.wikipediaApiUrl, { params }).pipe(
      map(response => {
        const pages = response.query?.pages;
        if (!pages) return null;
  
        const pageId = Object.keys(pages)[0];
        if (pageId === '-1') return null; 
  
        const formattedTitle = encodeURIComponent(author.replace(/ /g, '_'));
        return `https://en.wikipedia.org/wiki/${formattedTitle}`;
      })
    );
  }
  
}

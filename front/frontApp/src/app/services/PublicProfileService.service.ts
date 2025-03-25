import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environ/environ';

export interface PublicFavoriteBook {
  book_key: string;
  title: string;
  author?: string;
  cover_url?: string;
  rating?: number;
  review?: string;
}

export interface PublicUserProfile {
  username: string;
  email: string;
  register_date: string;  
  profile_picture?: string;  
  favorites: PublicFavoriteBook[];
}

@Injectable({
  providedIn: 'root'
})
export class PublicProfileService {
  private apiUrl = `${environment.apiUrl}users/public-profile/`;

  constructor(private http: HttpClient) {}

  getPublicProfile(username: string): Observable<PublicUserProfile> {
    return this.http.get<PublicUserProfile>(`${this.apiUrl}${username}/`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environ/environ';

export interface PublicUserProfile {
  username: string;
  email: string;
  profile_picture: string;
  first_name?: string;
  last_name?: string;
  date_joined: string;
  favorites: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PublicProfileService {
  private publicProfileSubject = new BehaviorSubject<PublicUserProfile | null>(null);
  public publicProfile$ = this.publicProfileSubject.asObservable();

  constructor(private http: HttpClient) {}

  getPublicProfile(username: string): Observable<PublicUserProfile> {
    const url = `${environment.apiUrl}users/public-profile/${username}/`;
    return new Observable((observer) => {
      this.http.get<PublicUserProfile>(url).subscribe({
        next: (profile) => {
          this.publicProfileSubject.next(profile);
          observer.next(profile);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environ/environ';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  date_joined: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
  password?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileUrl = `${environment.apiUrl}users/profile/`; 

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.profileUrl).pipe(
      tap(profile => this.currentUserSubject.next(profile)), 
      catchError((error) => {
        console.error("❌ Error fetching user profile:", error);
        return throwError(() => new Error("Failed to load user profile."));
      })
    );
  }

  updateUserProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.profileUrl, profileData).pipe(
      tap(profile => this.currentUserSubject.next(profile)),
      catchError((error) => {
        console.error('❌ Error updating user profile:', error);
        return throwError(() => new Error('Failed to update user profile.'));
      })
    );
  }

  setCurrentUser(user: UserProfile): void {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  clearUserProfile(): void {
    this.currentUserSubject.next(null);
  }
}

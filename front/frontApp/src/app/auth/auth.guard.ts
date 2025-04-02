import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserAuthServiceService } from '../services/UserAuthService.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: UserAuthServiceService, private router: Router) {}

  // Check if the user is authenticated, if not redirect to login page
  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']); 
      return false;
    }
    return true;
  }
}

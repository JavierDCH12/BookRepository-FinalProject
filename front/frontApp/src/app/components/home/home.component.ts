import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthServiceService } from '../../services/UserAuthService.service';
import { ProfileService, UserProfile } from '../../services/ProfileService.service';
import { CommonModule } from '@angular/common';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import { jwtDecode } from 'jwt-decode';
import { BookSearchComponent } from '../book-search/book-search.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, BookSearchComponent],
})
export class HomeComponent implements OnInit {
  isAuthenticated: boolean = false;
  userProfile: UserProfile | null = null;

  constructor(
    private userAuthService: UserAuthServiceService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.userAuthService.isAuthenticated();
    if (this.isAuthenticated) {
      this.loadUserProfile();
    }
  }

  private loadUserProfile(): void {
    this.profileService.getUserProfile().subscribe({
      next: (profile: UserProfile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('⚠️ Error loading profile:', error);
      }
    });
  }

  get username(): string {
    return localStorage.getItem('username') || 'Usuario';
  }

  logout() {
    this.userAuthService.logout();
    this.router.navigate([NAVIGATION_ROUTES.LOGIN]);
  }

  navigateToLogin() {
    this.router.navigate([NAVIGATION_ROUTES.LOGIN]);
  }

  navigateToRegister() {
    this.router.navigate([NAVIGATION_ROUTES.REGISTER]);
  }

  navigateToFavoriteList() {
    this.router.navigate([NAVIGATION_ROUTES.FAVORITES]);
  }

  navigateToProfile() {
    this.router.navigate([NAVIGATION_ROUTES.PROFILE]);
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BookSearchComponent } from '../book-search/book-search.component';
import { FavoriteListComponent } from '../favorite-list/favorite-list.component';
import { WishlistComponent } from '../wishlist/wishlist.component';

import { ProfileService, UserProfile } from '../../services/ProfileService.service';
import { UserAuthServiceService } from '../../services/UserAuthService.service';
import { FavoriteService, FavoriteBook } from '../../services/FavoriteService.service';
import { WishlistService } from '../../services/WishlistService.service';

import { Book } from '../../services/BookSearchService.service';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    BookSearchComponent,
    FavoriteListComponent,
    WishlistComponent
  ],
})
export class HomeComponent implements OnInit {
  isAuthenticated: boolean = false;
  userProfile: UserProfile | null = null;
  searchedUsername: string = '';

  currentView: 'search' | 'favorites' | 'wishlist' = 'search';
  wishlistCount: number = 0;

  constructor(
    private userAuthService: UserAuthServiceService,
    private profileService: ProfileService,
    private router: Router,
    private favoriteService: FavoriteService,
    private wishlistService: WishlistService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.userAuthService.isAuthenticated();

    if (this.isAuthenticated) {
      this.loadUserProfile();
      this.checkPendingFavorite();
      this.wishlistService.loadWishlist(); // inicializamos la carga
    }

    // Suscribirse al contador de wishlist
    this.wishlistService.wishlistCount$.subscribe(count => {
      this.wishlistCount = count;
    });

    // Perfil actual actualizado
    this.profileService.currentUser$.subscribe((profile: any) => {
      this.userProfile = profile;
    });

    // Evento tras login con favorito pendiente
    this.userAuthService.loginSuccessSourceAddBook$.subscribe(() => {
      this.isAuthenticated = true;
      this.loadUserProfile();
      this.checkPendingFavorite(); 
      this.wishlistService.loadWishlist(); // volvemos a cargar
    });
  }

  get username(): string {
    return this.userProfile?.username || localStorage.getItem('username') || 'Usuario';
  }

  setView(view: 'search' | 'favorites' | 'wishlist') {
    this.currentView = view;
  }

  navigateToPublicProfile() {
    if (this.searchedUsername.trim()) {
      this.router.navigate([`/user/${this.searchedUsername.trim()}`]);
    }
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

  private loadUserProfile(): void {
    this.profileService.getUserProfile().subscribe({
      next: (profile: any) => { this.userProfile = profile; },
      error: (error: any) => {
        console.error('⚠️ Error loading profile:', error);
      }
    });
  }

  private checkPendingFavorite() {
    const pendingBookData = localStorage.getItem('pendingFavoriteBook');
    if (pendingBookData) {
      const pendingBook: Book = JSON.parse(pendingBookData);

      const favoriteBook: FavoriteBook = {
        book_key: pendingBook.book_key,
        title: pendingBook.title,
        author: pendingBook.author || '',
        isbn: pendingBook.isbn || undefined,
        genres: Array.isArray(pendingBook.genres) ? pendingBook.genres : [],
        first_publish_year: pendingBook.first_publish_year || undefined,
        cover_url: pendingBook.cover_url || undefined,
        review: '',
        rating: 0,
      };

      this.favoriteService.addFavorite(favoriteBook).subscribe({
        next: () => {
          console.log(`✅ Libro '${favoriteBook.title}' añadido automáticamente después del login.`);
          localStorage.removeItem('pendingFavoriteBook');
          this.toastr.success(
            `'${favoriteBook.title}' se ha añadido a tus favoritos ⭐`,
            'Libro añadido'
          );
        },
        error: (err: any) => {
          console.error('⚠️ Error añadiendo favorito post-login:', err);
          localStorage.removeItem('pendingFavoriteBook');
          this.toastr.error(
            'No se pudo añadir el libro automáticamente.',
            'Error'
          );
        },
      });
    }
  }
}

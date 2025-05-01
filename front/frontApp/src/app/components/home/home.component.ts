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
import { environment } from '../../../environ/environ';

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
  environment = environment;
  timestamp: number = Date.now();



  currentView: 'search' | 'favorites' | 'wishlist' = 'search';
  wishlistCount: number = 0;
  favoriteCount: number = 0;


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
      this.loadUserProfile(); // ⚡ Cargar perfil si ya está autenticado
      this.checkPendingFavorite();
      this.checkPendingWishlist();
      this.wishlistService.loadWishlist();
      this.favoriteService.loadFavorites();
    } else {
      this.currentView = 'search';
    }

    // Suscripciones para actualizar el estado
    this.favoriteService.favoriteCount$.subscribe(count => {
      this.favoriteCount = count;
    });

    this.wishlistService.wishlistCount$.subscribe(count => {
      this.wishlistCount = count;
    });

    this.profileService.currentUser$.subscribe(profile => {
      this.userProfile = profile;
      this.timestamp = Date.now();
    });

    this.userAuthService.loginSuccessSourceAddBook$.subscribe(() => {
      this.isAuthenticated = true;
      this.loadUserProfile();
      this.checkPendingFavorite();
      this.checkPendingWishlist();
      this.wishlistService.loadWishlist();
      this.favoriteService.loadFavorites();
      this.currentView = 'search';
    });
  }

  setView(view: 'search' | 'favorites' | 'wishlist') {
    this.currentView = view;
  }

  // Función para navegar a la página de perfil público de un usuario
  navigateToPublicProfile() {
    if (this.searchedUsername.trim()) {
      this.router.navigate([`/user/${this.searchedUsername.trim()}`]);
    }
  }

  logout() {
    this.userAuthService.logout();
    this.userProfile = null;
    this.isAuthenticated = false;
    this.favoriteCount = 0;
    this.wishlistCount = 0;
    localStorage.clear(); // ⚡ Limpiar todo el almacenamiento local
    this.router.navigate(['/login']);
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


  // Función para cargar el perfil del usuario
  private loadUserProfile(): void {
    this.profileService.getUserProfile().subscribe({
      next: (profile: UserProfile) => {
        this.userProfile = profile;
        this.timestamp = Date.now(); // 👈 Forzar recarga de imagen
        localStorage.setItem('username', profile.username);
      },
      error: (error: any) => {
        console.error('⚠️ Error cargando el perfil:', error);
        this.logout();
      }
    });
  }
  

  // Función para comprobar si hay un libro pendiente de añadir a favoritos tras el login
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
          //console.log(`✅ Libro '${favoriteBook.title}' añadido automáticamente después del login.`);
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


  private checkPendingWishlist() {
    const pendingWishlistData = localStorage.getItem('pendingWishlistBook');
    if (pendingWishlistData) {
      const pendingBook: Book = JSON.parse(pendingWishlistData);
  
      const wishlistBook = {
        book_key: pendingBook.book_key,
        title: pendingBook.title,
        author: pendingBook.author || '',
        isbn: pendingBook.isbn || undefined,
        genres: Array.isArray(pendingBook.genres) ? pendingBook.genres : [],
        first_publish_year: pendingBook.first_publish_year || undefined,
        cover_url: pendingBook.cover_url || undefined,
      };
  
      this.wishlistService.addToWishlist(wishlistBook).subscribe({
        next: () => {
          //console.log(`Libro '${wishlistBook.title}' añadido a wishlist tras login.`);
          localStorage.removeItem('pendingWishlistBook');
          this.toastr.success(
            `'${wishlistBook.title}' se ha añadido a tu wishlist `,
            'Libro añadido'
          );
        },
        error: (err: any) => {
          console.error('Error añadiendo wishlist post-login:', err);
          localStorage.removeItem('pendingWishlistBook');
          this.toastr.error(
            'No se pudo añadir el libro automáticamente a la wishlist.',
            'Error'
          );
        },
      });
    }
  }

  get username(): string {
    return this.userProfile?.username || localStorage.getItem('username') || 'Usuario';
  }
}

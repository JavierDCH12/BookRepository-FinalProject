import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, Book, BookSearchResponse } from '../../services/BookSearchService.service';
import { FavoriteService, FavoriteBook } from '../../services/FavoriteService.service';
import { UserAuthServiceService } from '../../services/UserAuthService.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WikipediaService } from '../../services/WikipediaService.service';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import { WishlistBook, WishlistService } from '../../services/WishlistService.service';

@Component({
  selector: 'app-book-search',
  templateUrl: './book-search.component.html',
  styleUrls: ['./book-search.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BookSearchComponent implements OnInit {
  searchParams = { title: '', author: '', genre: '' };
  results: Book[] = [];
  favoriteBooks = new Set<string>();
  isLoading = false;
  errorMessage: string | null = null;
  isAuthenticated: boolean = false;
  wishlistBooks = new Set<string>();

  
  // Paginación
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  // Modal properties
  isModalOpen = false;
  selectedBookTitle: string | null = null;
  selectedBookDescription: string | null = null;
  isLoadingDescription = false;
  isModalAuthOpen = false;

  constructor(
    private searchService: SearchService,
    private favoriteService: FavoriteService,
    private router: Router,
    private wikipediaService: WikipediaService,
    private userAuthService: UserAuthServiceService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.userAuthService.isAuthenticated();
    console.log('🟢 User authenticated?', this.isAuthenticated);
    if (this.isAuthenticated) {
      this.loadFavorites();
      this.loadWishlist(); 
    }
  }
  

  toggleWishlist(book: Book): void {
    if (!this.isAuthenticated) {
      localStorage.setItem('pendingWishlistBook', JSON.stringify(book));
      this.openAuthModal();
      return;
    }
  
    if (this.isInWishlist(book.book_key)) {
      this.wishlistService.removeFromWishlist(book.book_key).subscribe({
        next: () => {
          this.wishlistBooks.delete(book.book_key);
        },
        error: () => console.error('⚠️ Error removing from wishlist'),
      });
    } else {
      const wishlistBook: WishlistBook = {
        book_key: book.book_key,
        title: book.title,
        author: book.author || '',
        isbn: book.isbn || undefined,
        genres: Array.isArray(book.genres) ? book.genres : [],
        cover_url: book.cover_url || undefined,
        first_publish_year: book.first_publish_year || undefined,
      };
  
      this.wishlistService.addToWishlist(wishlistBook).subscribe({
        next: () => {
          this.wishlistBooks.add(book.book_key);
        },
        error: () => console.error('⚠️ Error adding to wishlist'),
      });
    }
  }
  
  isInWishlist(bookKey: string): boolean {
    return this.wishlistBooks.has(bookKey);
  }

  loadWishlist(): void {
    this.wishlistService.getWishlist().subscribe({
      next: (wishlist: WishlistBook[]) => {
        this.wishlistBooks = new Set(wishlist.map(w => w.book_key));
      },
      error: () => console.error('⚠️ Error loading wishlist'),
    });
  }
  

  /** 🔍 Buscar libros */
  onSearch(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = null;

    const { title, author, genre } = this.searchParams;

    // Llamar a la API con la página actual y el límite de 20 por página
    this.searchService.searchBooks(title, author, genre, page).subscribe({
      next: (response: BookSearchResponse) => {
        this.results = response.books || [];
        this.totalCount = response.total_count;
        this.totalPages = response.total_pages;
        this.currentPage = response.current_page;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to fetch book results. Try again.';
        this.isLoading = false;
      },
    });
  }

  /** ⭐ Cargar favoritos */
  loadFavorites(): void {
    this.favoriteService.getFavorites().subscribe({
      next: (favorites: FavoriteBook[]) => {
        this.favoriteBooks = new Set(favorites.map(fav => fav.book_key));
      },
      error: () => console.error('⚠️ Error loading favorites'),
    });
  }

  formatGenres(genres: string | string[]): string {
    return Array.isArray(genres) ? genres.join(', ') : genres;
  }

  openAuthModal() {
    this.isModalAuthOpen = true;
  }
  
  closeAuthModal() {
    this.isModalAuthOpen = false;
  }

  /** ⭐ Añadir o quitar favoritos */
  toggleFavorite(book: Book): void { 
    if (!this.isAuthenticated) {
      localStorage.setItem('pendingFavoriteBook', JSON.stringify(book));
      this.openAuthModal();
      return;
    }
  
    if (this.isFavorite(book.book_key)) {
      this.favoriteService.removeFavorite(book.book_key).subscribe({
        next: () => {
          this.favoriteBooks.delete(book.book_key);
        },
        error: () => console.error('⚠️ Error removing favorite'),
      });
    } else {
      const favoriteBook: FavoriteBook = {
        book_key: book.book_key,
        title: book.title,
        author: book.author || '',
        isbn: book.isbn || undefined,
        genres: Array.isArray(book.genres) ? book.genres : [],
        first_publish_year: book.first_publish_year || undefined,
        cover_url: book.cover_url || undefined,
        review: '',
        rating: 0
      };
  
      this.favoriteService.addFavorite(favoriteBook).subscribe({
        next: () => {
          this.favoriteBooks.add(book.book_key);
        },
        error: () => console.error('⚠️ Error adding favorite'),
      });
    }
  }

  isFavorite(bookKey: string): boolean {
    return this.favoriteBooks.has(bookKey);
  }

  /** 📖 Modal descripción */
  openModal(book_key: string, title: string): void {
    if (!book_key) {
      this.selectedBookDescription = 'No description available.';
      return;
    }

    this.selectedBookTitle = title;
    this.selectedBookDescription = 'Loading description...';
    this.isModalOpen = true;
    this.isLoadingDescription = true;

    this.searchService.getBookDescription(book_key).subscribe({
      next: (response) => {
        this.selectedBookDescription = response.description || 'No description available.';
        this.isLoadingDescription = false;
      },
      error: () => {
        this.selectedBookDescription = 'No description available.';
        this.isLoadingDescription = false;
      }
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  getAuthorWikipediaLink(author: string): void {
    console.log(`🔎 Buscando en Wikipedia: ${author}`);
    this.wikipediaService.getWikipediaLink(author).subscribe({
      next: (link: string | null) => {
        if (link) {
          window.open(link, '_blank');
        } else {
          console.warn(`⚠️ No se encontró un enlace de Wikipedia para: ${author}`);
        }
      },
      error: (err) => {
        console.error(`❌ Error obteniendo el enlace de Wikipedia:`, err);
      }
    });
  }

  navigateToLogin() {
    this.router.navigate([NAVIGATION_ROUTES.LOGIN]);
  }
  
  navigateToRegister() {
    this.router.navigate([NAVIGATION_ROUTES.REGISTER]);
  }

  navigateToBookDetail(bookKey: string) {
    this.router.navigate([`${NAVIGATION_ROUTES.BOOK_DETAIL}/${bookKey}`]);
  }

  // Paginación
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.onSearch(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.onSearch(this.currentPage - 1);
    }
  }

 
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SearchService, Book, BookSearchResponse } from '../../services/BookSearchService.service';
import { FavoriteService, FavoriteBook } from '../../services/FavoriteService.service';
import { WishlistService, WishlistBook } from '../../services/WishlistService.service';
import { UserAuthServiceService } from '../../services/UserAuthService.service';
import { WikipediaService } from '../../services/WikipediaService.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { NAVIGATION_ROUTES } from '../../utils/constants';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-book-search',
  templateUrl: './book-search.component.html',
  styleUrls: ['./book-search.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressSpinnerModule]
})
export class BookSearchComponent implements OnInit {
  searchParams = { title: '', author: '', genre: '' };
  results: Book[] = [];
  favoriteBooks = new Set<string>();
  wishlistBooks = new Set<string>();
  isAuthenticated = false;
  isLoading = false;
  errorMessage: string | null = null;
  hasSearched = false;

  currentPage = 1;
  totalPages = 1;
  totalCount = 0;

  isModalOpen = false;
  selectedBookTitle: string | null = null;
  selectedBookDescription: string | null = null;
  isLoadingDescription = false;
  isModalAuthOpen = false;

  defaultCover = 'assets/default_cover.jpg';

  constructor(
    private searchService: SearchService,
    private favoriteService: FavoriteService,
    private wishlistService: WishlistService,
    private userAuthService: UserAuthServiceService,
    private wikipediaService: WikipediaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.userAuthService.isAuthenticated();

    if (this.isAuthenticated) {
      this.loadFavorites();
      this.loadWishlist();
    }
  }

  onSearch(page: number = 1): void {
    const { title, author, genre } = this.searchParams;

    if (!title.trim() && !author.trim() && !genre.trim()) {
      this.results = [];
      this.hasSearched = true;
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.hasSearched = true;

    this.searchService.searchBooks(title.trim(), author.trim(), genre.trim(), page)
      .subscribe({
        next: (response: BookSearchResponse) => {
          this.results = (response.books || []).map(book => ({
            ...book,
            cover_url: book.cover_url || this.defaultCover
          }));
          this.totalCount = response.total_count;
          this.totalPages = response.total_pages;
          this.currentPage = response.current_page;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudieron obtener los resultados.';
          this.isLoading = false;
        }
      });
  }

  onImageError(event: any): void {
    event.target.src = this.defaultCover;
  }

  private transformToBookDTO(book: Book): Partial<FavoriteBook & WishlistBook> {
    return {
      book_key: book.book_key,
      title: book.title,
      author: book.author || '',
      isbn: book.isbn || undefined,
      genres: Array.isArray(book.genres) ? book.genres : [],
      cover_url: book.cover_url || undefined,
      first_publish_year: book.first_publish_year || undefined
    };
  }

  trackByBookKey(index: number, book: Book): string {
    return book.book_key;
  }

  toggleAuthModal(open: boolean): void {
    this.isModalAuthOpen = open;
  }

  formatGenres(genres: string | string[]): string {
    return Array.isArray(genres) ? genres.join(', ') : genres;
  }

  loadFavorites(): void {
    this.favoriteService.getFavorites().pipe(take(1)).subscribe({
      next: (favorites: FavoriteBook[]) => {
        this.favoriteBooks = new Set(favorites.map(f => f.book_key));
      },
      error: () => console.error('Error loading favorites')
    });
  }

  

  isFavorite(bookKey: string): boolean {
    return this.favoriteBooks.has(bookKey);
  }

  loadWishlist(): void {
    this.wishlistService.loadWishlist().pipe(take(1)).subscribe({
      next: (wishlist: WishlistBook[]) => {
        this.wishlistBooks = new Set(wishlist.map(w => w.book_key));
      },
      error: () => console.error('Error loading wishlist')
    });
  }

  toggleFavorite(book: Book): void {
    if (!this.isAuthenticated) {
      const pendingBook = {
        ...this.transformToBookDTO(book),
        review: '',
        rating: 0
      };
      localStorage.setItem('pendingFavoriteBook', JSON.stringify(pendingBook));
      console.log('Guardado en localStorage favorito pendiente:', pendingBook);
      this.toggleAuthModal(true);
      return;
    }
  
    const key = book.book_key;
    if (this.isFavorite(key)) {
      this.favoriteService.removeFavorite(key).pipe(take(1)).subscribe({
        next: () => this.favoriteBooks.delete(key),
        error: () => console.error('Error removing favorite')
      });
    } else {
      const favorite: FavoriteBook = {
        ...this.transformToBookDTO(book),
        review: '',
        rating: 0
      } as FavoriteBook;
  
      this.favoriteService.addFavorite(favorite).pipe(take(1)).subscribe({
        next: () => this.favoriteBooks.add(key),
        error: () => console.error('Error adding favorite')
      });
    }
  }
  
  toggleWishlist(book: Book): void {
    if (!this.isAuthenticated) {
      const pendingWishlist = this.transformToBookDTO(book);
      localStorage.setItem('pendingWishlistBook', JSON.stringify(pendingWishlist));
      console.log('Guardado en localStorage wishlist pendiente:', pendingWishlist);
      this.toggleAuthModal(true);
      return;
    }
  
    const key = book.book_key;
    if (this.isInWishlist(key)) {
      this.wishlistService.removeFromWishlist(key).pipe(take(1)).subscribe({
        next: () => this.wishlistBooks.delete(key),
        error: () => console.error(' Error removing from wishlist')
      });
    } else {
      const wishlist: WishlistBook = this.transformToBookDTO(book) as WishlistBook;
  
      this.wishlistService.addToWishlist(wishlist).pipe(take(1)).subscribe({
        next: () => this.wishlistBooks.add(key),
        error: () => console.error(' Error adding to wishlist')
      });
    }
  }
  

  

  isInWishlist(bookKey: string): boolean {
    return this.wishlistBooks.has(bookKey);
  }

  getAuthorWikipediaLink(author: string): void {
    this.wikipediaService.getWikipediaLink(author).pipe(take(1)).subscribe({
      next: (link: string | null) => {
        if (link) {
          window.open(link, '_blank');
        } else {
          console.warn(` No Wikipedia link for ${author}`);
        }
      },
      error: (err) => console.error('❌ Wikipedia error:', err)
    });
  }

  navigateToBookDetail(bookKey: string): void {
    this.router.navigate([`${NAVIGATION_ROUTES.BOOK_DETAIL}/${bookKey}`]);
  }

  navigateToLogin(): void {
    this.router.navigate([NAVIGATION_ROUTES.LOGIN]);
  }

  navigateToRegister(): void {
    this.router.navigate([NAVIGATION_ROUTES.REGISTER]);
  }

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

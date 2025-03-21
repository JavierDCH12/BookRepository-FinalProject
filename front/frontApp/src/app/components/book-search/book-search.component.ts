import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, Book } from '../../services/BookSearchService.service';
import { FavoriteService, FavoriteBook } from '../../services/FavoriteService.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WikipediaService } from '../../services/WikipediaService.service';

@Component({
  selector: 'app-book-search',
  templateUrl: './book-search.component.html',
  styleUrls: ['./book-search.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BookSearchComponent {
  searchParams = { title: '', author: '', genre: '' };
  results: Book[] = [];
  favoriteBooks = new Set<string>();
  isLoading = false;
  errorMessage: string | null = null;
  isAuthenticated: boolean = false;

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
    private wikipediaService: WikipediaService
  ) {}

  /** 🔍 Buscar libros */
  onSearch(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const { title, author, genre } = this.searchParams;

    this.searchService.searchBooks(title, author, genre).subscribe({
      next: (response: Book[]) => {
        this.results = response || [];
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

  /** ✅ Formatear géneros */
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
  

  /** 📍 Verificar favorito */
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

  /** ❌ Cerrar modal */
  closeModal(): void {
    this.isModalOpen = false;
  }

  /** 🌐 Buscar autor en Wikipedia */
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
    this.router.navigate(['/login']);
  }
  
  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}

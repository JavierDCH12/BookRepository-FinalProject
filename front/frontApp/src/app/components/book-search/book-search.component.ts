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
  favoriteBooks = new Set<string>(); // ✅ Set para favoritos
  isLoading = false;
  errorMessage: string | null = null;
  isAuthenticated:boolean=false;

  // ✅ Se agregan las propiedades que faltaban en el modal
  isModalOpen = false;
  selectedBookTitle: string | null = null;
  selectedBookDescription: string | null = null;
  isLoadingDescription = false;

  constructor(private searchService: SearchService, private favoriteService: FavoriteService, private router: Router, private wikipediaService:WikipediaService) {}

  /** 🔍 Realizar búsqueda de libros */
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
        this.errorMessage = 'Failed to fetch book results. Try again';
        this.isLoading = false;
      },
    });
  }

  /** ⭐ Obtener favoritos del usuario */
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

  /** ⭐ Agregar o quitar un libro de favoritos */
  toggleFavorite(book: Book): void {
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
      };

      this.favoriteService.addFavorite(favoriteBook).subscribe({
        next: () => {
          this.favoriteBooks.add(book.book_key);
        },
        error: () => console.error('⚠️ Error adding favorite'),
      });
    }
  }

  /** 📍 Verificar si un libro está en favoritos */
  isFavorite(bookKey: string): boolean {
    return this.favoriteBooks.has(bookKey);
  }

  /** 📖 Abrir el modal para ver la descripción */
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

  /** ❌ Cerrar el modal */
  closeModal(): void {
    this.isModalOpen = false;
  }



  getAuthorWikipediaLink(author: string): void {
    console.log(`🔎 Buscando en Wikipedia: ${author}`);
  
    this.wikipediaService.getWikipediaLink(author).subscribe({
      next: (link: string | null) => {
        console.log("📡 Respuesta recibida:", link);
  
        if (link) {
          console.log(`🔗 Wikipedia link encontrado: ${link}`);
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
  
  
  



}

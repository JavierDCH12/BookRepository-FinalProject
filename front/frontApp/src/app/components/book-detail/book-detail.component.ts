import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService, Book } from '../../services/BookSearchService.service';
import { FavoriteService, FavoriteBook } from '../../services/FavoriteService.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css'],
  imports: [CommonModule, FormsModule]
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;
  isFavorite = false;
  reviewText: string = '';
  rating: number = 0;
  isEditingReview = false;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private searchService: SearchService,
    private favoriteService: FavoriteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const bookKey = this.route.snapshot.paramMap.get('bookKey');
    if (bookKey) {
      this.loadBookDetails(bookKey);
    }
  }

  /** 🔍 Cargar detalles del libro */
  loadBookDetails(bookKey: string): void {
    this.searchService.getBookDetails(bookKey).subscribe({
      next: (response: Book) => {
        this.book = response;
        this.isLoading = false;
        this.checkIfFavorite();
      },
      error: () => {
        console.error('❌ Error fetching book details');
        this.isLoading = false;
      },
    });
  }

  /** ⭐ Comprobar si el libro es favorito */
  checkIfFavorite(): void {
    if (!this.book) return;
    
    this.favoriteService.getFavorites().subscribe({
      next: (favorites: FavoriteBook[]) => {
        const favBook = favorites.find(fav => fav.book_key === this.book?.book_key);
        if (favBook) {
          this.isFavorite = true;
          this.reviewText = favBook.review || '';
          this.rating = favBook.rating || 0;
        }
      },
      error: () => console.error('⚠️ Error loading favorites'),
    });
  }

  /** ✅ Actualizar rating */
  updateBookRating(bookKey: string, rating: number): void {
    this.favoriteService.updateRating(bookKey, rating).subscribe({
      next: () => {
        console.log(`✅ Rating actualizado para ${bookKey}`);
        this.rating = rating;
      },
      error: (err) => console.error(`❌ Error actualizando rating:`, err)
    });
  }

  /** ⭐ Cambiar rating al pulsar una estrella */
  setRating(star: number): void {
    if (this.isFavorite && this.book) {
      this.updateBookRating(this.book.book_key, star);
    } else {
      console.warn('⚠️ El libro debe ser favorito para poder calificar.');
    }
  }

  formatGenres(genres: string[]): string {
    return genres.join(', ');
  }

  /** 💾 Guardar review */
  saveReview(): void {
    if (!this.book || !this.reviewText.trim()) return;

    this.favoriteService.manageReview(this.book.book_key, this.reviewText).subscribe({
      next: () => {
        console.log('✅ Review actualizada');
        this.isEditingReview = false;
      },
      error: () => console.error('❌ Error actualizando la review'),
    });
  }

  startEditReview(): void {
    this.isEditingReview = true;
  }

  cancelEditReview(): void {
    this.isEditingReview = false;
  }

  /** ➕ Añadir a favoritos */
  addToFavorites(): void {
    if (!this.book) return;

    const favoriteBook: FavoriteBook = {
      book_key: this.book.book_key,
      title: this.book.title,
      author: this.book.author || '',
      isbn: this.book.isbn || undefined,
      genres: Array.isArray(this.book.genres) ? this.book.genres : [],
      first_publish_year: this.book.first_publish_year || undefined,
      cover_url: this.book.cover_url || undefined,
      review: '',
      rating: 0,
    };

    this.favoriteService.addFavorite(favoriteBook).subscribe({
      next: () => {
        console.log(`✅ Libro añadido a favoritos`);
        this.isFavorite = true;
      },
      error: () => console.error('❌ Error añadiendo a favoritos'),
    });
  }

  /** ❌ Eliminar de favoritos */
  removeFromFavorites(): void {
    if (!this.book) return;

    this.favoriteService.removeFavorite(this.book.book_key).subscribe({
      next: () => {
        console.log(`✅ Libro eliminado de favoritos`);
        this.isFavorite = false;
      },
      error: () => console.error('❌ Error eliminando favorito'),
    });
  }
}

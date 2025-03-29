import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService, Book } from '../../services/BookSearchService.service';
import { FavoriteService } from '../../services/FavoriteService.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NAVIGATION_ROUTES } from '../../utils/constants';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;
  isFavorite = false;
  reviewText = '';
  isEditingReview = false;
  isLoading = true;
  rating = 0;
  tempRating = 0; // ⭐ Para hover visual

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

  loadBookDetails(bookKey: string): void {
    this.searchService.getBookDetails(bookKey).subscribe({
      next: (response: Book) => {
        this.book = response;
        this.checkIfFavorite(bookKey);
        this.isLoading = false;
      },
      error: () => {
        console.error('❌ Error fetching book details');
        this.isLoading = false;
      }
    });
  }

  checkIfFavorite(bookKey: string): void {
    this.favoriteService.getFavorites().subscribe({
      next: (favorites) => {
        const foundFavorite = favorites.find(fav => fav.book_key === bookKey);
        if (foundFavorite) {
          this.isFavorite = true;
          this.reviewText = foundFavorite.review || '';
          this.rating = foundFavorite.rating || 0;
        }
      },
      error: () => console.error('⚠️ Error loading favorites'),
    });
  }

  addToFavorites(): void {
    if (!this.book) return;

    const favoriteBook = {
      book_key: this.book.book_key,
      title: this.book.title,
      author: this.book.author || '',
      isbn: this.book.isbn || undefined,
      genres: this.book.genres || [],
      first_publish_year: this.book.first_publish_year || undefined,
      cover_url: this.book.cover_url || '',
      review: this.reviewText || '',
      rating: this.rating || 0
    };

    this.favoriteService.addFavorite(favoriteBook).subscribe({
      next: () => {
        this.isFavorite = true;
        console.log(`✅ ${this.book?.title} añadido a favoritos`);
      },
      error: (err) => console.error('❌ Error al añadir a favoritos:', err)
    });
  }

  removeFromFavorites(): void {
    if (!this.book) return;
    this.favoriteService.removeFavorite(this.book.book_key).subscribe({
      next: () => {
        this.isFavorite = false;
        this.reviewText = '';
        this.rating = 0;
        console.log(`✅ ${this.book?.title} eliminado de favoritos`);
      },
      error: (err) => console.error('❌ Error al eliminar de favoritos:', err)
    });
  }

  saveReview(): void {
    if (!this.book || !this.reviewText.trim()) return;
    this.favoriteService.manageReview(this.book.book_key, this.reviewText).subscribe({
      next: () => {
        console.log('✅ Reseña guardada');
        this.isEditingReview = false;
      },
      error: () => console.error('❌ Error al guardar la reseña'),
    });
  }

  startEditReview(): void {
    this.isEditingReview = true;
  }

  cancelEditReview(): void {
    this.isEditingReview = false;
  }

  formatGenres(genres: string[] | string): string {
    return Array.isArray(genres) ? genres.join(', ') : genres;
  }

  setRating(star: number): void {
    if (this.isFavorite && this.book) {
      this.rating = star;
      this.favoriteService.updateRating(this.book.book_key, star).subscribe({
        next: () => console.log(`✅ Rating actualizado a ${star} estrellas`),
        error: () => console.error('❌ Error al guardar el rating')
      });
    }
  }

  // Hover visual para estrellas
  onStarHover(star: number): void {
    if (this.isFavorite) {
      this.tempRating = star;
    }
  }

  onStarLeave(): void {
    this.tempRating = 0;
  }

  navigateToHome(): void {
    this.router.navigate([NAVIGATION_ROUTES.HOME]);
  }


  
}

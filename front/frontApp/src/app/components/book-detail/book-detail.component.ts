import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService, Book } from '../../services/BookSearchService.service';
import { FavoriteService } from '../../services/FavoriteService.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import Swal from 'sweetalert2';

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
  tempRating = 0;
  publicReviews: any[] = [];
  bookKey: string = '';

  constructor(
    private route: ActivatedRoute,
    private searchService: SearchService,
    private favoriteService: FavoriteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const bookKey = this.route.snapshot.paramMap.get('bookKey');
    if (bookKey) {
      this.bookKey = bookKey;
      this.loadBookDetails(bookKey);
      this.loadPublicReviews(bookKey);
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

  loadPublicReviews(bookKey: string): void {
    this.searchService.getPublicReviews(bookKey).subscribe({
      next: (reviews) => {
        this.publicReviews = reviews;
      },
      error: () => console.error('❌ Error fetching public reviews'),
    });
  }

  navigateToPublicProfile(username: string): void {
    this.router.navigate([`/user/${username}`]);
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
        Swal.fire({
          icon: 'success',
          title: '¡Añadido a favoritos!',
          text: `${this.book?.title} se ha añadido correctamente.`
        });
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
        Swal.fire({
          icon: 'success',
          title: 'Favorito eliminado',
          text: `${this.book?.title} se ha eliminado de tus favoritos.`
        });
      },
      error: (err) => console.error('❌ Error al eliminar de favoritos:', err)
    });
  }

  saveReview(): void {
    if (!this.book || !this.reviewText.trim()) return;
    this.favoriteService.manageReview(this.book.book_key, this.reviewText).subscribe({
      next: () => {
        this.isEditingReview = false;
        Swal.fire({
          icon: 'success',
          title: 'Reseña guardada',
          text: 'Tu reseña se ha guardado correctamente.'
        });
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

  setRating(star: number): void {
    if (this.isFavorite && this.book) {
      this.rating = star;
      this.favoriteService.updateRating(this.book.book_key, star).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Valoración actualizada',
            text: `Has valorado este libro con ${star} estrella(s).`
          });
        },
        error: () => console.error('❌ Error al actualizar el rating')
      });
    }
  }

  onStarHover(star: number): void {
    if (this.isFavorite) {
      this.tempRating = star;
    }
  }

  onStarLeave(): void {
    this.tempRating = 0;
  }

  formatGenres(genres: string[] | string): string {
    return Array.isArray(genres) ? genres.join(', ') : genres;
  }

  navigateToHome(): void {
    this.router.navigate([NAVIGATION_ROUTES.HOME]);
  }
}

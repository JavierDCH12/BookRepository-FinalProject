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
  imports: [CommonModule, FormsModule]
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;
  isFavorite: boolean = false;
  reviewText: string = '';
  isEditingReview: boolean = false;
  isLoading: boolean = true;
  rating: number = 0;

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

  // Cargar los detalles del libro desde la API
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

  // Verificar si el libro está en los favoritos
  checkIfFavorite(bookKey: string): void {
    this.favoriteService.getFavorites().subscribe({
      next: (favorites) => {
        const foundFavorite = favorites.find(fav => fav.book_key === bookKey);
        if (foundFavorite) {
          this.isFavorite = true;
          this.reviewText = foundFavorite.review || '';
          this.rating = foundFavorite.rating || 0; // Traer rating de los favoritos
        }
      },
      error: () => console.error('⚠️ Error loading favorites'),
    });
  }

  // Agregar a favoritos
  addToFavorites(): void {
    if (!this.book) return;

    const firstPublishYear = typeof this.book.first_publish_year === 'number'
      ? this.book.first_publish_year
      : parseInt((this.book.first_publish_year ?? '') as unknown as string, 10); 

    const favoriteBook = {
      book_key: this.book.book_key,
      title: this.book.title,
      author: this.book.author || '',
      genres: this.book.genres || [],
      first_publish_year: firstPublishYear,
      cover_url: this.book.cover_url || '',
      review: this.reviewText || '',
      rating: 0
    };

    this.favoriteService.addFavorite(favoriteBook).subscribe({
      next: () => {
        this.isFavorite = true;
        console.log(`✅ Book ${this.book?.title} added to favorites`);
      },
      error: (err) => console.error('❌ Error adding book to favorites:', err)
    });
  }

  // Eliminar de favoritos
  removeFromFavorites(): void {
    if (!this.book) return;
    this.favoriteService.removeFavorite(this.book.book_key).subscribe({
      next: () => {
        this.isFavorite = false;
        console.log(`✅ Book ${this.book?.title} removed from favorites`);
      },
      error: (err) => console.error('❌ Error removing book from favorites:', err)
    });
  }

  // Guardar la reseña
  saveReview(): void {
    if (!this.book || !this.reviewText.trim()) return;
    this.favoriteService.manageReview(this.book.book_key, this.reviewText).subscribe({
      next: () => {
        console.log('✅ Review updated');
        this.isEditingReview = false;
      },
      error: () => console.error('❌ Error saving review'),
    });
  }

  // Empezar a editar la reseña
  startEditReview(): void {
    this.isEditingReview = true;
  }

  // Cancelar la edición de la reseña
  cancelEditReview(): void {
    this.isEditingReview = false;
  }

  // Formatear los géneros
  formatGenres(genres: string | string[]): string {
    // Si 'genres' no es un arreglo, lo convertimos en uno
    if (typeof genres === 'string') {
      return genres;
    }
    return genres.join(', ');  // Si es un arreglo, lo unimos en una cadena separada por comas
  }
  

  // Navegar hacia la lista de libros
  navigateToHome(): void {
    this.router.navigate([NAVIGATION_ROUTES.FAVORITES]);
  }

  // Actualizar la valoración
  setRating(star: number): void {
    if (this.isFavorite && this.book) {
      this.rating = star;
      this.favoriteService.updateRating(this.book.book_key, this.rating).subscribe({
        next: () => {
          console.log(`✅ Rating updated for ${this.book?.title}`);
        },
        error: (err) => console.error('❌ Error updating rating:', err)
      });
    } else {
      console.warn('⚠️ The book must be in favorites to rate it.');
    }
  }
}

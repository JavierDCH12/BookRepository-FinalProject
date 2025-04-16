import { Component, OnInit } from '@angular/core';
import { FavoriteService, FavoriteBook } from '../../services/FavoriteService.service';
import { CommonModule } from '@angular/common';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import { Router } from '@angular/router';
import { WikipediaService } from '../../services/WikipediaService.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-favorite-list',
  templateUrl: './favorite-list.component.html',
  styleUrls: ['./favorite-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FavoriteListComponent implements OnInit {
  favoriteBooks: FavoriteBook[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  popularBooks: FavoriteBook[] = [];
  sortAscending: boolean = true;

  constructor(
    private favoriteService: FavoriteService,
    private router: Router,
    private wikipediaService: WikipediaService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.favoriteService.favoriteBooks$.subscribe({
      next: (favorites: FavoriteBook[]) => {
        this.favoriteBooks = favorites;
        this.isLoading = false;
        this.sortFavorites();
      },
      error: () => {
        this.errorMessage = 'Failed to load favorites.';
        this.isLoading = false;
      }
    });

    this.favoriteService.loadFavorites();
    this.loadPopularBooks();
  }

  loadPopularBooks(): void {
    this.favoriteService.getPopularBooks().subscribe({
      next: (books: FavoriteBook[]) => {
        this.popularBooks = books;
      },
      error: (err) => console.error('⚠️ Error loading popular books:', err),
    });
  }

  sortFavorites(): void {
    this.favoriteBooks.sort((a, b) => this.sortAscending ? a.rating - b.rating : b.rating - a.rating);
  }

  toggleSortOrder(): void {
    this.sortAscending = !this.sortAscending;
    this.sortFavorites();
  }

  removeFavorite(bookKey: string): void {
    const index = this.favoriteBooks.findIndex(book => book.book_key === bookKey);
    const removedBook = this.favoriteBooks[index];
    this.favoriteBooks.splice(index, 1);
  
    this.favoriteService.removeFavorite(bookKey).subscribe({
      next: () => {
      },
      error: (error) => {
        console.error('❌ Error eliminando favorito:', error);
        if (removedBook) {
          this.favoriteBooks.splice(index, 0, removedBook);
        }
      }
    });
  }
  

  trackByBookKey(index: number, book: FavoriteBook): string {
    return book.book_key;
  }

  updateBookRating(bookKey: string, rating: number) {
    const book = this.favoriteBooks.find(b => b.book_key === bookKey);
    if (book && book.rating !== rating) {
      book.rating = rating; 
  
      this.favoriteService.updateRating(bookKey, rating).subscribe({
        next: () => {
          console.log(`⭐ Rating actualizado a ${rating} para ${bookKey}`);
        },
        error: (err) => {
          console.error(`❌ Error actualizando rating para ${bookKey}`, err);
        }
      });
    }
  }
  

  getAuthorWikipediaLink(author: string): void {
    this.wikipediaService.getWikipediaLink(author).subscribe({
      next: (link: string | null) => {
        if (link) window.open(link, '_blank');
      },
      error: (err) => {
        console.error(`❌ Error obteniendo el enlace de Wikipedia:`, err);
      }
    });
  }

  navigateToHome() {
    this.router.navigate([NAVIGATION_ROUTES.HOME]);
  }

  navigateToBookDetail(bookKey: string) {
    this.router.navigate([`${NAVIGATION_ROUTES.BOOK_DETAIL}/${bookKey}`]);
  }
}

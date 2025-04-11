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
  editingReview: { [key: string]: boolean } = {}; 
  reviewTexts: { [key: string]: string } = {}; 
  popularBooks: FavoriteBook[] = [];
  sortAscending: boolean = true; 


  constructor(
    private favoriteService: FavoriteService, 
    private router: Router, 
    private wikipediaService: WikipediaService
  ) {}

  // Cargar los favoritos del usuario y los libros populares al iniciar el componente
  ngOnInit(): void {
    this.isLoading = true;
    this.favoriteService.favoriteBooks$.subscribe({
      next: (favorites: FavoriteBook[]) => {
        this.favoriteBooks = favorites;
        this.isLoading = false;
  
        favorites.forEach(book => {
          this.reviewTexts[book.book_key] = book.review || '';
        });
  
        this.sortFavorites();
      },
      error: () => {
        this.errorMessage = 'Failed to load favorites.';
        this.isLoading = false;
      }
    });
  
    this.favoriteService.loadFavorites(); // Dispara la carga
    this.loadPopularBooks();
  }
  

  // Cargar los libros populares
  loadPopularBooks(): void {
    this.favoriteService.getPopularBooks().subscribe({
      next: (books: FavoriteBook[]) => {
        this.popularBooks = books;
      },
      error: (err) => console.error('⚠️ Error loading popular books:', err),
    });
  }
  // Cargar los favoritos del usuario
  loadFavorites(): void {
    this.isLoading = true;
    this.favoriteService.getFavorites().subscribe({
      next: (favorites: FavoriteBook[]) => {
        //console.log("📸 Libros favoritos recibidos:", favorites);
        this.favoriteBooks = favorites;

        // Inicializar textos de reseñas
        favorites.forEach(book => {
          this.reviewTexts[book.book_key] = book.review || '';
        });

        this.sortFavorites(); 

        this.isLoading = false;
      },
      error: (error) => {
        console.error('⚠️ Error loading favorites:', error);
        this.errorMessage = 'Failed to load favorites.';
        this.isLoading = false;
      }
    });
  }

  // Ordenar los favoritos por rating 
  sortFavorites(): void {
    this.favoriteBooks.sort((a, b) => this.sortAscending ? a.rating - b.rating : b.rating - a.rating);
  }

  // Alternar el orden de clasificación 
  toggleSortOrder(): void {
    this.sortAscending = !this.sortAscending;
    this.sortFavorites();
  }

  // Eliminar un libro de favoritos 
  // removeFavorite(bookKey: string): void {
  //   if (!bookKey) {
  //     console.error('⚠️ Error: bookKey no válido.');
  //     return;
  //   }

  //   //console.log(`🔍 Intentando eliminar el favorito con bookKey: ${bookKey}`);

  //   this.favoriteService.removeFavorite(bookKey).subscribe({
  //     next: () => {
  //       //console.log(`✅ Libro con bookKey: ${bookKey} eliminado correctamente`);
  //       this.favoriteBooks = this.favoriteBooks.filter(book => book.book_key !== bookKey);
  //     },
  //     error: (error) => {
  //       console.error('⚠️ Error eliminando favorito:', error);
  //     }
  //   });
  // }


  removeFavorite(bookKey: string): void {
    this.favoriteService.removeFavorite(bookKey).subscribe({
      next: () => this.favoriteService.loadFavorites(),
      error: (error) => console.error('⚠️ Error eliminando favorito:', error)
    });
  }

  // Alternar el estado de edición de reseñas 
  toggleReviewEdit(bookKey: string): void {
    this.editingReview[bookKey] = !this.editingReview[bookKey];
  }

  // Guardar la reseña de un libro 
  saveReview(bookKey: string): void {
    const reviewText = this.reviewTexts[bookKey];

    if (!reviewText.trim()) {
      console.warn(`⚠️ No se puede guardar una reseña vacía para ${bookKey}`);
      return;
    }

    //console.log(`💾 Guardando reseña para ${bookKey}:`, reviewText);

    this.favoriteService.manageReview(bookKey, reviewText).subscribe({
      next: () => {
        //console.log(`✅ Reseña guardada para ${bookKey}`);
        this.toggleReviewEdit(bookKey);
      },
      error: (error) => {
        //console.error(`❌ Error guardando reseña para ${bookKey}:`, error);
      }
    });
  }

  // Obtener enlace de Wikipedia del autor 
  getAuthorWikipediaLink(author: string): void {
    //(`🔎 Buscando en Wikipedia: ${author}`);

    this.wikipediaService.getWikipediaLink(author).subscribe({
      next: (link: string | null) => {
        //console.log("📡 Respuesta recibida:", link);

        if (link) {
          //console.log(`🔗 Wikipedia link encontrado: ${link}`);
          window.open(link, '_blank');
        } else {
          //console.warn(`⚠️ No se encontró un enlace de Wikipedia para: ${author}`);
        }
      },
      error: (err) => {
        //console.error(`❌ Error obteniendo el enlace de Wikipedia:`, err);
      }
    });
  }

  // Volver a la página de inicio 
  navigateToHome() {
    this.router.navigate([NAVIGATION_ROUTES.HOME]);
  }

  // Actualizar el rating de un libro
  updateBookRating(bookKey: string, rating: number) {
    this.favoriteService.updateRating(bookKey, rating).subscribe({
      next: () => {
        //console.log(`✅ Rating actualizado para ${bookKey}`);
        const book = this.favoriteBooks.find(b => b.book_key === bookKey);
        if (book) book.rating = rating;
      },
      error: (err) => {}
    });
  }

  // Navegar a la página de detalles de un libro
  navigateToBookDetail(bookKey: string) {
    //console.log('Navigating to book:', bookKey);

    this.router.navigate([`${NAVIGATION_ROUTES.BOOK_DETAIL}/${bookKey}`]);
  }


}

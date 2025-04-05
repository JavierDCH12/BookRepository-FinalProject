import { Component, OnInit } from '@angular/core';
import { WishlistService, WishlistBook } from '../../services/WishlistService.service';
import { Router } from '@angular/router';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import { CommonModule } from '@angular/common';
import { WikipediaService } from '../../services/WikipediaService.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule]
})
export class WishlistComponent implements OnInit {
  wishlistBooks: WishlistBook[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private wishlistService: WishlistService,
    private router: Router,
    private wikipediaService: WikipediaService
  ) {}

  ngOnInit(): void {
    this.fetchWishlist();
  }


  // Get link para el autor en Wikipedia
  getAuthorWikipediaLink(author: string): void {
    //console.log(`🔎 Buscando en Wikipedia: ${author}`);

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

  // Coger lista de wishlist
  fetchWishlist(): void {
    this.isLoading = true;
    this.wishlistService.getWishlist().subscribe({
      next: (books) => {
        this.wishlistBooks = books;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading your wishlist.';
        this.isLoading = false;
      }
    });
  }

  // Eliminar libro de la wishlist
  removeFromWishlist(bookKey: string): void {
    this.wishlistService.removeFromWishlist(bookKey).subscribe({
      next: () => {
        this.wishlistBooks = this.wishlistBooks.filter(b => b.book_key !== bookKey);
      },
      error: () => {
        console.error('❌ Error removing book from wishlist');
      }
    });
  }

  // Navegar a la página de detalles del libro
  navigateToBookDetail(bookKey: string): void {
    this.router.navigate([`${NAVIGATION_ROUTES.BOOK_DETAIL}/${bookKey}`]);
  }
}

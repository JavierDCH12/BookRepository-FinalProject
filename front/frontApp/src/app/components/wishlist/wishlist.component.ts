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
    this.isLoading = true;

    this.wishlistService.loadWishlist();

    this.wishlistService.wishlist$.subscribe({
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

  getAuthorWikipediaLink(author: string): void {
    this.wikipediaService.getWikipediaLink(author).subscribe({
      next: (link: string | null) => {
        if (link) window.open(link, '_blank');
      },
      error: (err) => console.error('❌ Error obteniendo Wikipedia:', err)
    });
  }

  removeFromWishlist(bookKey: string): void {
    this.wishlistService.removeFromWishlist(bookKey).subscribe({
      error: () => console.error('❌ Error removing book from wishlist')
    });
  }

  // 📖 Ir al detalle
  navigateToBookDetail(bookKey: string): void {
    this.router.navigate([`${NAVIGATION_ROUTES.BOOK_DETAIL}/${bookKey}`]);
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { WishlistService, WishlistBook } from '../../services/WishlistService.service';
import { Router } from '@angular/router';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import { CommonModule } from '@angular/common';
import { WikipediaService } from '../../services/WikipediaService.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule]
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlistBooks: WishlistBook[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  private wishlistSub!: Subscription;

  constructor(
    private wishlistService: WishlistService,
    private router: Router,
    private wikipediaService: WikipediaService
  ) {}

  ngOnInit(): void {
    this.wishlistService.loadWishlist();

    this.wishlistSub = this.wishlistService.wishlist$.subscribe({
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

  ngOnDestroy(): void {
    if (this.wishlistSub) this.wishlistSub.unsubscribe();
  }

  getAuthorWikipediaLink(author: string): void {
    this.wikipediaService.getWikipediaLink(author).subscribe({
      next: (link: string | null) => {
        if (link) window.open(link, '_blank');
      },
      error: (err) => console.error(' Error obteniendo Wikipedia:', err)
    });
  }

  removeFromWishlist(bookKey: string): void {
    this.wishlistBooks = this.wishlistBooks.filter(b => b.book_key !== bookKey);
  
    this.wishlistService.removeFromWishlist(bookKey).subscribe({
      next: () => {
        console.log(` ${bookKey} eliminado de la wishlist`);
      },
      error: (err) => {
        console.warn(` Error al eliminar ${bookKey} del backend`, err);
      }
    });
  }
  
  

  navigateToBookDetail(bookKey: string): void {
    this.router.navigate([`${NAVIGATION_ROUTES.BOOK_DETAIL}/${bookKey}`]);
  }
}

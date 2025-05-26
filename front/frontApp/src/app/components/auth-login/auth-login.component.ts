import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserAuthServiceService } from '../../services/UserAuthService.service';
import { FavoriteService } from '../../services/FavoriteService.service';
import { WishlistService } from '../../services/WishlistService.service';
import { NAVIGATION_ROUTES } from '../../utils/constants';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.css'],
})
export class AuthLoginComponent {
  loginForm: FormGroup;
  backendErrorMessage: string | null = null;
  isSubmitting: boolean = false;
  showPassword: boolean = false; 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userAuthServiceService: UserAuthServiceService,
    private favoriteService: FavoriteService,            // 👈 NUEVO
    private wishlistService: WishlistService             // 👈 NUEVO
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


    

  onSubmit() {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      const { username, password } = this.loginForm.value;

      this.userAuthServiceService.loginUser(username, password).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.backendErrorMessage = null;
          this.loginForm.reset();

          this.favoriteService.processPendingFavorite();

          this.wishlistService.processPendingWishlist();

          this.router.navigate(['/home']);
        },
        
        error: (error) => {
          this.isSubmitting = false;
          this.backendErrorMessage = error?.message || 'Credenciales inválidas.';
        },
      });
    } else {
      this.backendErrorMessage = 'Please fill out the form correctly.';
    }
  }

  navigateToRegister() {
    this.router.navigate([NAVIGATION_ROUTES.REGISTER]);
  }
}

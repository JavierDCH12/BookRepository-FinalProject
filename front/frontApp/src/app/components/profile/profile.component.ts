import { Component, OnInit } from '@angular/core';
import {
  ProfileService,
  UserProfile,
} from '../../services/ProfileService.service';
import { Router } from '@angular/router';
import { LOCAL_MEDIA, NAVIGATION_ROUTES } from '../../utils/constants';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { environment } from '../../../environ/environ';
import { supabase } from '../../../supabase/supaBaseClient';
import { FavoriteService } from '../../services/FavoriteService.service';
import { WishlistService } from '../../services/WishlistService.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  selectedFile: File | null = null;
  environment = environment;
  LOCAL_MEDIA = LOCAL_MEDIA;
  favoriteCount: number = 0;
  wishlistCount: number = 0;
  averageRating: number = 0;

  timestamp: number = Date.now();


  editMode = false;
  editedProfile: Partial<UserProfile> = {};
  showStats = true;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private favoriteService: FavoriteService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.favoriteService.getFavorites().subscribe(favorites => {
      this.favoriteCount = favorites.length;
      const totalRating = favorites.reduce((acc, fav) => acc + (fav.rating || 0), 0);
      this.averageRating = favorites.length ? +(totalRating / favorites.length).toFixed(1) : 0;
    });

    this.wishlistService.wishlist$.subscribe(wishlist => {
      this.wishlistCount = wishlist.length;
    });
  }

  activateEditMode(): void {
    this.editMode = true;
    this.showStats = false;
    if (this.userProfile) {
      this.editedProfile = { ...this.userProfile };
    }
  }

  activateStatsMode(): void {
    this.editMode = false;
    this.showStats = true;
  }

  setViewStats(show: boolean): void {
    this.showStats = show;
    if (!show) this.editMode = false;
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.profileService.getUserProfile().subscribe({
      next: (profile: UserProfile) => {
        console.log(' Perfil recargado:', profile);
        this.userProfile = profile;
        this.timestamp = Date.now(); 
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage = 'Failed to load user profile.';
        this.isLoading = false;
      },
    });
  }
  

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode && this.userProfile) {
      this.editedProfile = { ...this.userProfile };
    }
  }

  saveProfileChanges(): void {
    if (!this.editedProfile) return;

    this.profileService.updateUserProfile(this.editedProfile).subscribe({
      next: () => {
        this.editMode = false;
        Swal.fire({
          title: '¡Perfil actualizado!',
          text: 'Tu perfil ha sido actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Volver al Inicio',
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          this.navigateToHome();
        });
      },
      error: (error) => {
        console.error(' Error updating profile:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al actualizar el perfil. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Cerrar',
        });
      },
    });
  }

  cancelEdit(): void {
    this.editMode = false;
    this.showStats = true;
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      this.uploadProfilePicture();
    }
  }
  
  async uploadProfilePicture(): Promise<void> {
    if (!this.selectedFile || !this.userProfile) return;
  
    const file = this.selectedFile;
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop(); 
    const filePath = `user_${this.userProfile.id}/profile_${timestamp}.${fileExtension}`;
  
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
  
    if (uploadError) {
      console.error(' Error al subir a Supabase:', uploadError.message);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo subir la foto. Inténtalo de nuevo.',
        icon: 'error',
      });
      return;
    }
  
    const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
    const imageUrl = data.publicUrl;
  
    this.profileService.updateUserProfile({ profile_picture: imageUrl }).subscribe({
      next: () => {
        this.loadUserProfile(); 
  
        Swal.fire({
          title: ' Imagen actualizada',
          text: 'Tu foto de perfil se ha subido correctamente.',
          icon: 'success',
        });
      },
      error: (err) => {
        console.error(' Error actualizando el perfil:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar tu perfil con la nueva imagen.',
          icon: 'error',
        });
      },
    });
  }
  
  

  navigateToHome(): void {
    this.router.navigate([NAVIGATION_ROUTES.HOME]);
  }
}

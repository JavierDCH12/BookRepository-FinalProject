import { Component, OnInit } from '@angular/core';
import { ProfileService, UserProfile } from '../../services/ProfileService.service';
import { Router } from '@angular/router';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import Swal from 'sweetalert2';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploadModule, ButtonModule]
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  editMode = false;
  editedProfile: Partial<UserProfile> = {};

  constructor(private profileService: ProfileService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.profileService.getUserProfile().subscribe({
      next: (profile: UserProfile) => {
        this.userProfile = profile;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load user profile.';
        this.isLoading = false;
      }
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
        Swal.fire('¡Perfil actualizado!', 'Tu perfil ha sido actualizado correctamente.', 'success');
        this.navigateToHome();
      },
      error: () => {
        Swal.fire('Error', 'Hubo un problema al actualizar el perfil.', 'error');
      }
    });
  }

  // ✅ Subida de imagen usando PrimeNG p-fileUpload
  onFileUpload(event: any): void {
    const file = event.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    this.profileService.uploadProfilePicture(formData).subscribe({
      next: (response) => {
        if (this.userProfile) this.userProfile.profile_picture = response.profile_picture;
        Swal.fire('¡Imagen actualizada!', 'Tu foto de perfil se ha subido correctamente.', 'success');
      },
      error: () => {
        Swal.fire('Error', 'Hubo un problema al subir la imagen.', 'error');
      }
    });
  }

  navigateToHome(): void {
    this.router.navigate([NAVIGATION_ROUTES.HOME]);
  }
}

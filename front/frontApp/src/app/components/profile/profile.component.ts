import { Component, OnInit } from '@angular/core';
import { ProfileService, UserProfile } from '../../services/ProfileService.service';
import { Router } from '@angular/router';
import { NAVIGATION_ROUTES } from '../../utils/constants';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ SOLUCIÓN: Importar FormsModule

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule] // ✅ SOLUCIÓN: Añadir FormsModule aquí
})
export class ProfileComponent implements OnInit {

  userProfile: UserProfile | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  selectedFile: File | null = null;

  // ✅ Variables para la edición del perfil
  editMode = false;
  editedProfile: Partial<UserProfile> = {};

  constructor(private profileService: ProfileService, private router: Router) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  // ✅ Cargar el perfil del usuario
  loadUserProfile(): void {
    this.isLoading = true;
    this.profileService.getUserProfile().subscribe({
      next: (profile: UserProfile) => {
        console.log("✅ Perfil recibido:", profile);
        this.userProfile = profile;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('⚠️ Error loading profile:', error);
        this.errorMessage = 'Failed to load user profile.';
        this.isLoading = false;
      }
    });
  }

  // ✅ Alternar modo edición
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode && this.userProfile) {
      this.editedProfile = { ...this.userProfile };
    }
  }

  saveProfileChanges(): void {
    if (!this.editedProfile) return;
  
    this.profileService.updateUserProfile(this.editedProfile).subscribe({
      next: (response) => {
        console.log("✅ Perfil actualizado:", response);
        this.editMode = false;
        alert("✅ Profile updated successfully!");
        this.navigateToHome();
      },
      error: (error) => {
        console.error("❌ Error updating profile:", error);
      }
    });
  }
  
  

  // ✅ Seleccionar y subir imagen de perfil
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      this.uploadProfilePicture();
    }
  }

  // ✅ Subir la nueva imagen de perfil
  uploadProfilePicture(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('profile_picture', this.selectedFile);

    this.profileService.uploadProfilePicture(formData).subscribe({
      next: (response) => {
        console.log("✅ Imagen subida correctamente:", response);
        if (this.userProfile) {
          this.userProfile.profile_picture = response.profile_picture;
        }
        alert("✅ Profile picture updated successfully!");
      },
      error: (error) => console.error('Error uploading profile picture:', error)
    });
  }

  // ✅ Volver a la página de inicio
  navigateToHome(): void {
    this.router.navigate([NAVIGATION_ROUTES.HOME]);
  }
}

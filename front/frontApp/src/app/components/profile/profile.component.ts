import { Component, OnInit } from '@angular/core';
import { ProfileService, UserProfile } from '../../services/ProfileService.service';
import { Router } from '@angular/router';
import { LOCAL_MEDIA, NAVIGATION_ROUTES } from '../../utils/constants';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import Swal from 'sweetalert2';
import { environment } from '../../../environ/environ';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule] 
})
export class ProfileComponent implements OnInit {

  userProfile: UserProfile | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  selectedFile: File | null = null;
  environment = environment;
  LOCAL_MEDIA = LOCAL_MEDIA; // Para acceder a la URL de la imagen por defecto

  //Variables para la edición del perfil
  editMode = false;
  editedProfile: Partial<UserProfile> = {};

  constructor(private profileService: ProfileService, private router: Router) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  //Cargar el perfil del usuario
  loadUserProfile(): void {
    this.isLoading = true;
    this.profileService.getUserProfile().subscribe({
      next: (profile: UserProfile) => {
        //console.log("✅ Perfil recibido:", profile);
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

  //Alternar modo edición
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode && this.userProfile) {
      this.editedProfile = { ...this.userProfile };
    }
  }

    //  Guardar cambios en el perfil
  saveProfileChanges(): void {
    if (!this.editedProfile) return;
  
    this.profileService.updateUserProfile(this.editedProfile).subscribe({
      next: (response) => {
        //console.log("✅ Perfil actualizado:", response);
        this.editMode = false;
  
        Swal.fire({
          title: '¡Perfil actualizado!',
          text: 'Tu perfil ha sido actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Volver al Inicio',
          timer: 3000,  
          timerProgressBar: true
        }).then(() => {
          this.navigateToHome();
        });
      },
      error: (error) => {
        console.error("❌ Error updating profile:", error);
  
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al actualizar el perfil. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  }
  
  
  

  // Seleccionar y subir imagen de perfil
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      this.uploadProfilePicture();
    }
  }

  // Subir imagen de perfil
  uploadProfilePicture(): void {
    if (!this.selectedFile) return;
  
    const formData = new FormData();
    formData.append('profile_picture', this.selectedFile);
  
    this.profileService.uploadProfilePicture(formData).subscribe({
      next: (response) => {
        //console.log("✅ Imagen subida correctamente:", response);
        if (this.userProfile) {
          this.userProfile.profile_picture = response.profile_picture;
        }
  
        Swal.fire({
          title: '¡Imagen actualizada!',
          text: 'Tu foto de perfil se ha subido correctamente.',
          icon: 'success',
          confirmButtonText: 'OK',
          timer: 2500,  
          timerProgressBar: true
        });
      },
      error: (error) => {
        console.error('❌ Error uploading profile picture:', error);
  
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al subir la imagen. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  }
  

  // Volver a la página de inicio
  navigateToHome(): void {
    this.router.navigate([NAVIGATION_ROUTES.HOME]);
  }
}

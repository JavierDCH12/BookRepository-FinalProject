import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PublicProfileService, PublicUserProfile } from '../../services/PublicProfileService.service';
import { NAVIGATION_ROUTES } from '../../utils/constants';


@Component({
  selector: 'app-public-profile',
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PublicProfileComponent implements OnInit {
  userProfile: PublicUserProfile | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
      private route: ActivatedRoute,
      private publicProfileService: PublicProfileService,
      private router: Router
    ) {}

    ngOnInit(): void {
      const username = this.route.snapshot.paramMap.get('username');
      if (username && username.trim()) {
        this.loadPublicProfile(username.trim());
      } else {
        this.errorMessage = 'Invalid username.';
        this.isLoading = false;
      }
    }

    
    
    // Método para recargar el perfil público
    reloadProfile(): void {
      if (this.userProfile?.username) {
        this.loadPublicProfile(this.userProfile.username);
      }
    }
    
    // Método para cargar el perfil público
    private loadPublicProfile(username: string): void {
      this.isLoading = true;
      this.publicProfileService.getPublicProfile(username).subscribe({
        next: (profile) => {
          console.log('📡 Perfil recibido del backend:', profile); 
    
          // Mostrar cada campo por separado para debugging
          console.log(`👤 Username: ${profile.username}`);
          console.log(`📧 Email: ${profile.email}`);
          console.log(`📅 Fecha de registro: ${profile.register_date}`);
          console.log(`🖼️ Foto de perfil: ${profile.profile_picture || 'No disponible'}`);
          console.log(`🧑 Nombre: ${profile.first_name || '(No especificado)'}`);
          console.log(`👪 Apellido: ${profile.last_name || '(No especificado)'}`);
          console.log(`📚 Libros favoritos (${profile.favorites.length}):`, profile.favorites);
    
          this.userProfile = profile;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error al cargar perfil público:', err);
          this.errorMessage = `El usuario "${username}" no existe o no se pudo cargar.`;
          this.userProfile = null;
          this.isLoading = false;
        }
      });
    }
    
  // Método para navegar a la página de inicio
  navigateToHome() {
      this.router.navigate([NAVIGATION_ROUTES.HOME]);
    }




}

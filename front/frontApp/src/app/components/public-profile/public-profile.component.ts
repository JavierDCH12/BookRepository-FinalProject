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
    if (username) {
      this.loadPublicProfile(username);
    }
  }

  private loadPublicProfile(username: string): void {
    this.isLoading = true;
    this.publicProfileService.getPublicProfile(username).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'User not found or failed to load profile.';
        this.isLoading = false;
      }
    });
  }

  navigateToHome() {
      this.router.navigate([NAVIGATION_ROUTES.HOME]);
    }




}

import { Routes } from '@angular/router';
import {AuthRegisterComponent } from './components/auth-register/auth-register.component';
import { AuthLoginComponent } from './components/auth-login/auth-login.component';
import { HomeComponent } from './components/home/home.component';
import { FavoriteListComponent } from './components/favorite-list/favorite-list.component';
import { ProfileComponent } from './components/profile/profile.component';
import { PublicProfileComponent } from './components/public-profile/public-profile.component';
import { BookDetailComponent } from './components/book-detail/book-detail.component';
import { WishlistComponent } from './components/wishlist/wishlist.component';

export const routes: Routes = [
    { path: 'register', component: AuthRegisterComponent },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'login', component: AuthLoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'favorites', component: FavoriteListComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'user/:username', component: PublicProfileComponent }, 
    { path: 'book-detail/:bookKey', component: BookDetailComponent },  
    { path: '**', redirectTo: 'home' },
    { path: 'wishlist', component: WishlistComponent },


];


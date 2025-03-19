import { Routes } from '@angular/router';
import {AuthRegisterComponent } from './components/auth-register/auth-register.component';
import { AuthLoginComponent } from './components/auth-login/auth-login.component';
import { HomeComponent } from './components/home/home.component';
import { FavoriteListComponent } from './components/favorite-list/favorite-list.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [

    {path: 'register', component: AuthRegisterComponent},
    { path: '', redirectTo: 'home' , pathMatch: 'full' },
    { path: 'login', component: AuthLoginComponent},
    {path: 'home', component: HomeComponent}, 
    {path: '**', redirectTo: ' '},
    { path: 'favorites', component: FavoriteListComponent},
    { path: 'profile', component: ProfileComponent }






];

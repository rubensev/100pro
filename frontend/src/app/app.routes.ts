import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '',
    loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'explore', loadComponent: () => import('./features/explore/explore.component').then(m => m.ExploreComponent) },
      { path: 'schedule', canActivate: [authGuard], loadComponent: () => import('./features/schedule/schedule.component').then(m => m.ScheduleComponent) },
      { path: 'messages', canActivate: [authGuard], loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent) },
      { path: 'provider', canActivate: [authGuard], loadComponent: () => import('./features/provider/provider.component').then(m => m.ProviderComponent) },
      { path: 'pricing', loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent) },
      { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'p/:id', loadComponent: () => import('./features/public-profile/public-profile.component').then(m => m.PublicProfileComponent) },
      { path: 'store/:id', loadComponent: () => import('./features/store/store-page.component').then(m => m.StorePageComponent) },
    ],
  },
  { path: '**', redirectTo: 'home' },
];

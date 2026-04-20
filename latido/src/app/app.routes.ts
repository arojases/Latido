import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/latido-home.component').then((module) => module.LatidoHomeComponent),
    title: 'Latido 💖'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

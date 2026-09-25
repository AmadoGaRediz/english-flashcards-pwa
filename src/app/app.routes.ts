import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'session',
    loadComponent: () => import('./pages/session/session').then((m) => m.Session),
  },
  {
    path: 'summary',
    loadComponent: () => import('./pages/summary/summary').then((m) => m.Summary),
  },
  {
    path: 'vocabulary',
    loadComponent: () => import('./pages/vocabulary/vocabulary').then((m) => m.Vocabulary),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
  },
  { path: '**', redirectTo: '' },
];

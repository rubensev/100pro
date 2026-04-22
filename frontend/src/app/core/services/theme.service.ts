import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = '100pro_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  dark = signal<boolean>(localStorage.getItem(STORAGE_KEY) === 'dark');

  constructor() { this.apply(); }

  toggle() {
    this.dark.update(d => !d);
    this.apply();
  }

  private apply() {
    const isDark = this.dark();
    isDark
      ? document.documentElement.setAttribute('data-theme', 'dark')
      : document.documentElement.removeAttribute('data-theme');
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }
}

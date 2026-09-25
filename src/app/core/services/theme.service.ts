import { Injectable, signal } from '@angular/core';
import { AppDatabase } from './db.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly darkMode = signal(false);

  constructor(private db: AppDatabase) {}

  async init(): Promise<void> {
    const settings = await this.db.getSettings();
    this.apply(settings.darkMode);
  }

  async toggle(): Promise<void> {
    const next = !this.darkMode();
    this.apply(next);
    const settings = await this.db.getSettings();
    await this.db.saveSettings({ ...settings, darkMode: next });
  }

  private apply(dark: boolean): void {
    this.darkMode.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}

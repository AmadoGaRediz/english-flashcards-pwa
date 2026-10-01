import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SwUpdate } from '@angular/service-worker';
import { AppDatabase, Settings as AppSettings } from '../../core/services/db.service';
import { ProgressService } from '../../core/services/progress.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  readonly loading = signal(true);
  readonly settings = signal<AppSettings | null>(null);
  readonly message = signal('');
  readonly checkingUpdate = signal(false);

  constructor(
    private router: Router,
    private db: AppDatabase,
    private progressService: ProgressService,
    private themeService: ThemeService,
    private swUpdate: SwUpdate,
  ) {}

  async ngOnInit(): Promise<void> {
    this.settings.set(await this.db.getSettings());
    this.loading.set(false);
  }

  async updateDirection(direction: AppSettings['direction']): Promise<void> {
    const current = this.settings();
    if (!current) return;
    const updated = { ...current, direction };
    this.settings.set(updated);
    await this.db.saveSettings(updated);
  }

  async updateNewWordsPerDay(value: number): Promise<void> {
    const current = this.settings();
    if (!current) return;
    const updated = { ...current, newWordsPerDay: value };
    this.settings.set(updated);
    await this.db.saveSettings(updated);
  }

  async toggleDarkMode(): Promise<void> {
    await this.themeService.toggle();
    const current = this.settings();
    if (current) this.settings.set({ ...current, darkMode: this.themeService.darkMode() });
  }

  async toggleSound(): Promise<void> {
    const current = this.settings();
    if (!current) return;
    const updated = { ...current, soundEnabled: !current.soundEnabled };
    this.settings.set(updated);
    await this.db.saveSettings(updated);
  }

  async checkForUpdates(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      this.showMessage('Las actualizaciones solo funcionan con la app instalada u online.');
      return;
    }

    this.checkingUpdate.set(true);
    try {
      const updateFound = await this.swUpdate.checkForUpdate();
      if (!updateFound) {
        this.showMessage('Ya tienes la última versión.');
        return;
      }
      this.showMessage('Actualización encontrada, instalando...');
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch {
      this.showMessage('No se pudo comprobar actualizaciones. Revisa tu conexión.');
    } finally {
      this.checkingUpdate.set(false);
    }
  }

  async exportData(): Promise<void> {
    const json = await this.progressService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-flashcards-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showMessage('Progreso exportado.');
  }

  async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await this.progressService.importData(text);
      this.showMessage('Progreso importado correctamente.');
    } catch {
      this.showMessage('El archivo no es válido.');
    }
    input.value = '';
  }

  async resetProgress(): Promise<void> {
    if (!confirm('¿Seguro que quieres borrar todo tu progreso? Esta acción no se puede deshacer.')) return;
    await this.progressService.resetAll();
    this.showMessage('Progreso reiniciado.');
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private showMessage(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(''), 3000);
  }
}

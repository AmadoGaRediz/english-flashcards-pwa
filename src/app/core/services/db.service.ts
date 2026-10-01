import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { WordProgress } from '../models/progress.model';

export interface Settings {
  key: string;
  direction: 'en-es' | 'es-en' | 'mixed';
  newWordsPerDay: number;
  darkMode: boolean;
  pronunciationEnabled: boolean;
  streak: number;
  lastStudyDay: string | null;
  newWordsIntroducedToday: number;
  newWordsDate: string | null;
  sessionsCompleted: number;
  perfectSessions: number;
  unlockedAchievements: string[];
}

const DEFAULT_SETTINGS: Settings = {
  key: 'app',
  direction: 'mixed',
  newWordsPerDay: 8,
  darkMode: false,
  pronunciationEnabled: true,
  streak: 0,
  lastStudyDay: null,
  newWordsIntroducedToday: 0,
  newWordsDate: null,
  sessionsCompleted: 0,
  perfectSessions: 0,
  unlockedAchievements: [],
};

@Injectable({ providedIn: 'root' })
export class AppDatabase extends Dexie {
  progress!: Table<WordProgress, number>;
  settings!: Table<Settings, string>;

  constructor() {
    super('english-flashcards-db');
    this.version(1).stores({
      progress: 'wordId, dueAt',
      settings: 'key',
    });
  }

  async getSettings(): Promise<Settings> {
    const existing = await this.settings.get('app');
    if (existing) return { ...DEFAULT_SETTINGS, ...existing };
    await this.settings.put(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.settings.put(settings);
  }
}

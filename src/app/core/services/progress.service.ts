import { Injectable, signal } from '@angular/core';
import { AppDatabase } from './db.service';
import { SrsService } from './srs.service';
import { WordsService } from './words.service';
import { WordProgress, createInitialProgress } from '../models/progress.model';
import { Word } from '../models/word.model';

export interface WordWithProgress {
  word: Word;
  progress: WordProgress | null;
  mastery: number;
}

const MASTERY_THRESHOLD = 85;

@Injectable({ providedIn: 'root' })
export class ProgressService {
  /** Bumped whenever progress changes, so views can react without a full store. */
  readonly version = signal(0);

  constructor(
    private db: AppDatabase,
    private srs: SrsService,
    private wordsService: WordsService,
  ) {}

  async getProgress(wordId: number): Promise<WordProgress | undefined> {
    return this.db.progress.get(wordId);
  }

  async getAllProgress(): Promise<WordProgress[]> {
    return this.db.progress.toArray();
  }

  async recordAnswer(wordId: number, correct: boolean, responseTimeMs: number): Promise<WordProgress> {
    const existing = (await this.db.progress.get(wordId)) ?? createInitialProgress(wordId);
    const updated = this.srs.applyAnswer(existing, correct, responseTimeMs);
    await this.db.progress.put(updated);
    this.version.update((v) => v + 1);
    return updated;
  }

  async recordStudyDay(): Promise<number> {
    const settings = await this.db.getSettings();
    const today = new Date().toISOString().slice(0, 10);
    if (settings.lastStudyDay === today) return settings.streak;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = settings.lastStudyDay === yesterday ? settings.streak + 1 : 1;

    await this.db.saveSettings({ ...settings, streak, lastStudyDay: today });
    return streak;
  }

  async getDueWordIds(now = Date.now()): Promise<number[]> {
    const all = await this.db.progress.toArray();
    return all.filter((p) => this.srs.isDue(p, now)).map((p) => p.wordId);
  }

  async getMastery(wordId: number, now = Date.now()): Promise<number> {
    const progress = await this.db.progress.get(wordId);
    if (!progress) return 0;
    return this.srs.masteryPercent(progress, now);
  }

  async getGlobalStats(): Promise<{ total: number; mastered: number; learning: number; dueToday: number }> {
    const words = await this.wordsService.loadAll();
    const allProgress = await this.db.progress.toArray();
    const progressMap = new Map(allProgress.map((p) => [p.wordId, p]));
    const now = Date.now();

    let mastered = 0;
    let learning = 0;
    let dueToday = 0;

    for (const word of words) {
      const p = progressMap.get(word.id);
      if (!p) continue;
      learning++;
      if (this.srs.masteryPercent(p, now) >= MASTERY_THRESHOLD) mastered++;
      if (this.srs.isDue(p, now)) dueToday++;
    }

    return { total: words.length, mastered, learning, dueToday };
  }

  async getVocabularyList(): Promise<WordWithProgress[]> {
    const words = await this.wordsService.loadAll();
    const allProgress = await this.db.progress.toArray();
    const progressMap = new Map(allProgress.map((p) => [p.wordId, p]));
    const now = Date.now();

    return words.map((word) => {
      const progress = progressMap.get(word.id) ?? null;
      const mastery = progress ? this.srs.masteryPercent(progress, now) : 0;
      return { word, progress, mastery };
    });
  }

  async resetAll(): Promise<void> {
    await this.db.progress.clear();
    this.version.update((v) => v + 1);
  }

  async exportData(): Promise<string> {
    const progress = await this.db.progress.toArray();
    const settings = await this.db.getSettings();
    return JSON.stringify({ progress, settings, exportedAt: new Date().toISOString() }, null, 2);
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json) as { progress: WordProgress[]; settings?: any };
    await this.db.progress.clear();
    await this.db.progress.bulkPut(data.progress);
    if (data.settings) await this.db.saveSettings(data.settings);
    this.version.update((v) => v + 1);
  }
}

import { Injectable } from '@angular/core';
import { Word } from '../models/word.model';
import { AchievementDef } from '../models/achievement.model';

export interface WordMasteryChange {
  word: Word;
  before: number;
  after: number;
}

export interface SessionResult {
  correct: number;
  wrong: number;
  changes: WordMasteryChange[];
  newAchievements: AchievementDef[];
}

@Injectable({ providedIn: 'root' })
export class SessionResultStore {
  private result: SessionResult | null = null;

  set(result: SessionResult): void {
    this.result = result;
  }

  consume(): SessionResult | null {
    const result = this.result;
    this.result = null;
    return result;
  }
}

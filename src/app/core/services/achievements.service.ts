import { Injectable } from '@angular/core';
import { AppDatabase } from './db.service';
import { ACHIEVEMENTS, AchievementDef, AchievementStats } from '../models/achievement.model';

export interface AchievementStatus extends AchievementDef {
  unlocked: boolean;
}

@Injectable({ providedIn: 'root' })
export class AchievementsService {
  readonly all: AchievementDef[] = ACHIEVEMENTS;

  constructor(private db: AppDatabase) {}

  /** Evaluates current stats against all achievement definitions and persists any newly unlocked ones. */
  async evaluate(stats: AchievementStats): Promise<AchievementDef[]> {
    const settings = await this.db.getSettings();
    const unlockedSet = new Set(settings.unlockedAchievements);
    const newlyUnlocked: AchievementDef[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedSet.has(achievement.id)) continue;
      if (achievement.isUnlocked(stats)) {
        unlockedSet.add(achievement.id);
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      await this.db.saveSettings({ ...settings, unlockedAchievements: [...unlockedSet] });
    }

    return newlyUnlocked;
  }

  async getStatuses(): Promise<AchievementStatus[]> {
    const settings = await this.db.getSettings();
    const unlockedSet = new Set(settings.unlockedAchievements);
    return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: unlockedSet.has(a.id) }));
  }
}

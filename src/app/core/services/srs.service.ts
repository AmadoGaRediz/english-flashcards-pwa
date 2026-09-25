import { Injectable } from '@angular/core';
import { WordProgress } from '../models/progress.model';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const HISTORY_LIMIT = 10;
const FAST_ANSWER_MS = 4000;

/**
 * Simplified SM-2 spaced-repetition engine adapted for multiple-choice quizzes.
 */
@Injectable({ providedIn: 'root' })
export class SrsService {
  applyAnswer(progress: WordProgress, correct: boolean, responseTimeMs: number, now = Date.now()): WordProgress {
    const history = [...progress.history, correct ? 1 : 0].slice(-HISTORY_LIMIT);

    if (!correct) {
      return {
        ...progress,
        reps: 0,
        interval: 0,
        ease: Math.max(MIN_EASE, progress.ease - 0.2),
        dueAt: now,
        history,
        lastSeen: now,
      };
    }

    const reps = progress.reps + 1;
    let ease = progress.ease;
    if (responseTimeMs <= FAST_ANSWER_MS) {
      ease = Math.min(MAX_EASE, ease + 0.05);
    }

    let interval: number;
    if (reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      interval = 3;
    } else {
      interval = Math.round(progress.interval * ease);
    }
    interval = Math.max(1, interval);

    return {
      ...progress,
      reps,
      interval,
      ease,
      dueAt: now + interval * DAY_MS,
      history,
      lastSeen: now,
    };
  }

  isDue(progress: WordProgress, now = Date.now()): boolean {
    return progress.dueAt <= now;
  }

  /**
   * Mastery % combines recent accuracy, how consolidated the interval is,
   * and decays as time since last review grows relative to the interval.
   */
  masteryPercent(progress: WordProgress, now = Date.now()): number {
    if (progress.history.length === 0) return 0;

    const precision = this.weightedAccuracy(progress.history);
    const consolidation = Math.min(progress.interval / 30, 1);
    const daysSinceLastSeen = (now - progress.lastSeen) / DAY_MS;
    const retention = Math.exp(-daysSinceLastSeen / (progress.interval + 1));

    const raw = (0.6 * precision + 0.4 * consolidation) * (0.5 + 0.5 * retention);
    return Math.round(Math.max(0, Math.min(1, raw)) * 100);
  }

  private weightedAccuracy(history: number[]): number {
    let weightedSum = 0;
    let weightTotal = 0;
    history.forEach((value, index) => {
      const weight = index + 1;
      weightedSum += value * weight;
      weightTotal += weight;
    });
    return weightTotal === 0 ? 0 : weightedSum / weightTotal;
  }
}

import { Injectable } from '@angular/core';
import { Word } from '../models/word.model';
import { WordsService } from './words.service';
import { ProgressService } from './progress.service';
import { Settings } from './db.service';

export type QuizDirection = 'en-es' | 'es-en';

export interface QuizOption {
  label: string;
  isCorrect: boolean;
}

export interface QuizCard {
  word: Word;
  direction: QuizDirection;
  prompt: string;
  options: QuizOption[];
}

const SESSION_SIZE = 15;
const OPTIONS_COUNT = 4;

@Injectable({ providedIn: 'root' })
export class QuizService {
  constructor(
    private wordsService: WordsService,
    private progressService: ProgressService,
  ) {}

  async getSessionWords(sessionSize = SESSION_SIZE): Promise<Word[]> {
    const remainingNewWordsToday = await this.progressService.getRemainingNewWordsToday();
    const allWords = await this.wordsService.loadAll();
    const allProgress = await this.progressService.getAllProgress();
    const progressMap = new Map(allProgress.map((p) => [p.wordId, p]));
    const now = Date.now();

    const due = allWords
      .filter((w) => {
        const p = progressMap.get(w.id);
        return p && p.dueAt <= now;
      })
      .sort((a, b) => {
        const pa = progressMap.get(a.id)!;
        const pb = progressMap.get(b.id)!;
        return pa.dueAt - pb.dueAt;
      });

    const remainingSlots = Math.max(0, sessionSize - due.length);
    const newWords = allWords
      .filter((w) => !progressMap.has(w.id))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, Math.min(remainingSlots, remainingNewWordsToday));

    const session = [...due.slice(0, sessionSize), ...newWords].slice(0, sessionSize);

    if (session.length === 0) {
      // Nothing due and nothing new left to introduce: fall back to lowest-mastery known words.
      return allWords
        .filter((w) => progressMap.has(w.id))
        .sort((a, b) => a.rank - b.rank)
        .slice(0, sessionSize);
    }

    return session;
  }

  async buildCard(word: Word, directionSetting: Settings['direction']): Promise<QuizCard> {
    const direction: QuizDirection =
      directionSetting === 'mixed' ? (Math.random() < 0.5 ? 'en-es' : 'es-en') : directionSetting;

    const distractors = await this.wordsService.pickDistractors(word, OPTIONS_COUNT - 1, direction);

    let prompt: string;
    let correctLabel: string;
    let optionLabels: string[];

    if (direction === 'en-es') {
      prompt = word.en;
      correctLabel = word.es[0];
      optionLabels = distractors.map((d) => d.es[0]);
    } else {
      prompt = word.es[0];
      correctLabel = word.en;
      optionLabels = distractors.map((d) => d.en);
    }

    const options: QuizOption[] = this.shuffle([
      { label: correctLabel, isCorrect: true },
      ...optionLabels.map((label) => ({ label, isCorrect: false })),
    ]);

    return { word, direction, prompt, options };
  }

  private shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

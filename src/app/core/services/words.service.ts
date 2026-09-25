import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Word } from '../models/word.model';

export type DistractorDirection = 'en-es' | 'es-en';

@Injectable({ providedIn: 'root' })
export class WordsService {
  private wordsPromise: Promise<Word[]> | null = null;
  private byId = new Map<number, Word>();

  constructor(private http: HttpClient) {}

  async loadAll(): Promise<Word[]> {
    if (!this.wordsPromise) {
      this.wordsPromise = firstValueFrom(this.http.get<Word[]>('data/words.json')).then(
        (words) => {
          words.sort((a, b) => a.rank - b.rank);
          for (const w of words) this.byId.set(w.id, w);
          return words;
        },
      );
    }
    return this.wordsPromise;
  }

  async getById(id: number): Promise<Word | undefined> {
    await this.loadAll();
    return this.byId.get(id);
  }

  async getManyByIds(ids: number[]): Promise<Word[]> {
    await this.loadAll();
    return ids.map((id) => this.byId.get(id)).filter((w): w is Word => !!w);
  }

  /**
   * Picks distractor words for a multiple-choice quiz: same part of speech,
   * close frequency rank, and guaranteed not to share a displayed label with
   * the target or with each other (e.g. "in"/"on"/"at" all translating to "en").
   */
  async pickDistractors(target: Word, count: number, direction: DistractorDirection): Promise<Word[]> {
    const all = await this.loadAll();
    const label = (w: Word) => (direction === 'en-es' ? w.es[0].toLowerCase() : w.en.toLowerCase());
    const targetEs = new Set(target.es.map((s) => s.toLowerCase()));

    const candidates = all.filter(
      (w) =>
        w.id !== target.id &&
        w.pos === target.pos &&
        !w.es.some((s) => targetEs.has(s.toLowerCase())),
    );

    candidates.sort(
      (a, b) => Math.abs(a.rank - target.rank) - Math.abs(b.rank - target.rank),
    );

    const pool = this.shuffle(candidates.slice(0, Math.max(count * 6, 20)));

    const usedLabels = new Set([label(target)]);
    const picked: Word[] = [];
    for (const candidate of pool) {
      if (picked.length >= count) break;
      const candidateLabel = label(candidate);
      if (usedLabels.has(candidateLabel)) continue;
      usedLabels.add(candidateLabel);
      picked.push(candidate);
    }

    return picked;
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

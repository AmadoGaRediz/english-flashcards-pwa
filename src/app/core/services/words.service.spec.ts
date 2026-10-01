import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { WordsService } from './words.service';
import { Word } from '../models/word.model';

function makeWord(overrides: Partial<Word>): Word {
  return {
    id: 0,
    en: 'word',
    es: ['palabra'],
    pos: 'noun',
    rank: 1,
    example: 'An example sentence.',
    ...overrides,
  };
}

function createService(words: Word[]): WordsService {
  const fakeHttp = { get: () => of(words) } as unknown as HttpClient;
  return new WordsService(fakeHttp);
}

describe('WordsService.pickDistractors', () => {
  it('only picks words of the same part of speech', () => {
    const target = makeWord({ id: 1, en: 'run', es: ['correr'], pos: 'verb', rank: 10 });
    const words = [
      target,
      makeWord({ id: 2, en: 'jump', es: ['saltar'], pos: 'verb', rank: 11 }),
      makeWord({ id: 3, en: 'house', es: ['casa'], pos: 'noun', rank: 12 }),
      makeWord({ id: 4, en: 'walk', es: ['caminar'], pos: 'verb', rank: 13 }),
      makeWord({ id: 5, en: 'swim', es: ['nadar'], pos: 'verb', rank: 14 }),
    ];
    const service = createService(words);

    return service.pickDistractors(target, 3, 'en-es').then((distractors) => {
      expect(distractors.length).toBe(3);
      expect(distractors.every((d) => d.pos === 'verb')).toBe(true);
      expect(distractors.some((d) => d.id === target.id)).toBe(false);
    });
  });

  it('never returns a distractor whose Spanish translation overlaps the target', async () => {
    const target = makeWord({ id: 1, en: 'from', es: ['desde', 'de'], pos: 'prep', rank: 10 });
    const words = [
      target,
      makeWord({ id: 2, en: 'of', es: ['de'], pos: 'prep', rank: 11 }), // overlaps via "de"
      makeWord({ id: 3, en: 'with', es: ['con'], pos: 'prep', rank: 12 }),
      makeWord({ id: 4, en: 'for', es: ['para'], pos: 'prep', rank: 13 }),
      makeWord({ id: 5, en: 'by', es: ['por'], pos: 'prep', rank: 14 }),
    ];
    const service = createService(words);

    const distractors = await service.pickDistractors(target, 3, 'en-es');
    expect(distractors.some((d) => d.en === 'of')).toBe(false);
  });

  it('never returns two distractors that share the same displayed label (regression)', async () => {
    // "in", "on" and "at" would all show "en" as their primary Spanish
    // translation; the quiz must never offer two options with the same text.
    const target = makeWord({ id: 1, en: 'that', es: ['que'], pos: 'conj', rank: 8 });
    const words = [
      target,
      makeWord({ id: 2, en: 'than', es: ['que'], pos: 'conj', rank: 66 }), // same label as target
      makeWord({ id: 3, en: 'because', es: ['porque'], pos: 'conj', rank: 20 }),
      makeWord({ id: 4, en: 'although', es: ['aunque'], pos: 'conj', rank: 30 }),
      makeWord({ id: 5, en: 'while', es: ['mientras'], pos: 'conj', rank: 40 }),
      makeWord({ id: 6, en: 'since', es: ['desde'], pos: 'conj', rank: 50 }),
    ];
    const service = createService(words);

    const distractors = await service.pickDistractors(target, 4, 'en-es');
    const labels = distractors.map((d) => d.es[0].toLowerCase());

    expect(labels).not.toContain('que'); // would collide with the target's own label
    expect(new Set(labels).size).toBe(labels.length); // no duplicate labels among themselves
  });

  it('dedupes by English label (not Spanish) in the es->en direction', async () => {
    const target = makeWord({ id: 1, en: 'big', es: ['grande'], pos: 'adj', rank: 10 });
    const words = [
      target,
      makeWord({ id: 2, en: 'large', es: ['amplio', 'grande'], pos: 'adj', rank: 11 }),
      makeWord({ id: 3, en: 'small', es: ['pequeño'], pos: 'adj', rank: 12 }),
      makeWord({ id: 4, en: 'old', es: ['viejo'], pos: 'adj', rank: 13 }),
      makeWord({ id: 5, en: 'new', es: ['nuevo'], pos: 'adj', rank: 14 }),
    ];
    const service = createService(words);

    const distractors = await service.pickDistractors(target, 3, 'es-en');
    expect(distractors.some((d) => d.en === 'large')).toBe(false); // shares "grande" with target
  });

  it('returns fewer than requested if not enough valid candidates exist, without throwing', async () => {
    const target = makeWord({ id: 1, en: 'yes', es: ['sí'], pos: 'interj', rank: 1 });
    const words = [target, makeWord({ id: 2, en: 'no', es: ['no'], pos: 'interj', rank: 2 })];
    const service = createService(words);

    const distractors = await service.pickDistractors(target, 3, 'en-es');
    expect(distractors.length).toBe(1);
  });
});

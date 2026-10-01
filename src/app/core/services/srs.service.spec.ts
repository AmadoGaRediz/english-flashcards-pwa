import { SrsService } from './srs.service';
import { createInitialProgress } from '../models/progress.model';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('SrsService', () => {
  let srs: SrsService;
  const now = 1_700_000_000_000;

  beforeEach(() => {
    srs = new SrsService();
  });

  describe('applyAnswer', () => {
    it('schedules a 1-day interval on the first correct answer', () => {
      const progress = createInitialProgress(1, now);
      const updated = srs.applyAnswer(progress, true, 1000, now);

      expect(updated.reps).toBe(1);
      expect(updated.interval).toBe(1);
      expect(updated.dueAt).toBe(now + DAY_MS);
      expect(updated.history).toEqual([1]);
    });

    it('schedules a 3-day interval on the second consecutive correct answer', () => {
      let progress = createInitialProgress(1, now);
      progress = srs.applyAnswer(progress, true, 1000, now);
      progress = srs.applyAnswer(progress, true, 1000, now);

      expect(progress.reps).toBe(2);
      expect(progress.interval).toBe(3);
    });

    it('grows the interval by the ease factor from the third correct answer onward', () => {
      let progress = createInitialProgress(1, now);
      progress = srs.applyAnswer(progress, true, 1000, now); // reps 1, interval 1
      progress = srs.applyAnswer(progress, true, 1000, now); // reps 2, interval 3
      const easeBefore = progress.ease;
      progress = srs.applyAnswer(progress, true, 1000, now); // reps 3, interval ~3*ease

      expect(progress.reps).toBe(3);
      expect(progress.interval).toBe(Math.round(3 * easeBefore));
    });

    it('resets reps and interval and makes the word due immediately on a wrong answer', () => {
      let progress = createInitialProgress(1, now);
      progress = srs.applyAnswer(progress, true, 1000, now);
      progress = srs.applyAnswer(progress, false, 1000, now);

      expect(progress.reps).toBe(0);
      expect(progress.interval).toBe(0);
      expect(progress.dueAt).toBe(now);
      expect(progress.history).toEqual([1, 0]);
    });

    it('lowers ease on a wrong answer but never below the floor of 1.3', () => {
      let progress = createInitialProgress(1, now);
      for (let i = 0; i < 20; i++) {
        progress = srs.applyAnswer(progress, false, 1000, now);
      }
      expect(progress.ease).toBeCloseTo(1.3);
    });

    it('raises ease slightly on a fast correct answer, capped at 3.0', () => {
      let progress = createInitialProgress(1, now);
      const before = progress.ease;
      progress = srs.applyAnswer(progress, true, 500, now); // fast (<=4000ms)
      expect(progress.ease).toBeCloseTo(before + 0.05);
    });

    it('does not raise ease on a slow correct answer', () => {
      let progress = createInitialProgress(1, now);
      const before = progress.ease;
      progress = srs.applyAnswer(progress, true, 10_000, now); // slow (>4000ms)
      expect(progress.ease).toBe(before);
    });

    it('keeps only the last 10 results in history', () => {
      let progress = createInitialProgress(1, now);
      for (let i = 0; i < 15; i++) {
        progress = srs.applyAnswer(progress, true, 1000, now);
      }
      expect(progress.history.length).toBe(10);
    });
  });

  describe('isDue', () => {
    it('is due when dueAt has passed', () => {
      const progress = { ...createInitialProgress(1, now), dueAt: now - 1 };
      expect(srs.isDue(progress, now)).toBe(true);
    });

    it('is not due when dueAt is in the future', () => {
      const progress = { ...createInitialProgress(1, now), dueAt: now + 1 };
      expect(srs.isDue(progress, now)).toBe(false);
    });
  });

  describe('masteryPercent', () => {
    it('is 0% for a word with no history yet', () => {
      const progress = createInitialProgress(1, now);
      expect(srs.masteryPercent(progress, now)).toBe(0);
    });

    it('is higher right after a single correct answer than after a correct-then-wrong-then-correct run', () => {
      let justRight = createInitialProgress(1, now);
      justRight = srs.applyAnswer(justRight, true, 1000, now);

      let recovered = createInitialProgress(2, now);
      recovered = srs.applyAnswer(recovered, true, 1000, now);
      recovered = srs.applyAnswer(recovered, false, 1000, now);
      recovered = srs.applyAnswer(recovered, true, 1000, now);

      const masteryJustRight = srs.masteryPercent(justRight, now);
      const masteryRecovered = srs.masteryPercent(recovered, now);

      expect(masteryJustRight).toBeGreaterThan(masteryRecovered);
    });

    it('is 0% after two wrong answers in a row', () => {
      let progress = createInitialProgress(1, now);
      progress = srs.applyAnswer(progress, false, 1000, now);
      progress = srs.applyAnswer(progress, false, 1000, now);
      expect(srs.masteryPercent(progress, now)).toBe(0);
    });

    it('decays as time passes since the word was last seen', () => {
      let progress = createInitialProgress(1, now);
      progress = srs.applyAnswer(progress, true, 1000, now);

      const freshMastery = srs.masteryPercent(progress, now);
      const laterMastery = srs.masteryPercent(progress, now + 20 * DAY_MS);

      expect(laterMastery).toBeLessThan(freshMastery);
    });

    it('never exceeds 100%', () => {
      let progress = createInitialProgress(1, now);
      for (let i = 0; i < 10; i++) {
        progress = srs.applyAnswer(progress, true, 500, now);
      }
      expect(srs.masteryPercent(progress, now)).toBeLessThanOrEqual(100);
    });
  });
});

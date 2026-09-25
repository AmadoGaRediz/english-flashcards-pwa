export interface WordProgress {
  wordId: number;
  reps: number;
  interval: number;
  ease: number;
  dueAt: number;
  history: number[];
  lastSeen: number;
}

export function createInitialProgress(wordId: number, now = Date.now()): WordProgress {
  return {
    wordId,
    reps: 0,
    interval: 0,
    ease: 2.5,
    dueAt: now,
    history: [],
    lastSeen: now,
  };
}

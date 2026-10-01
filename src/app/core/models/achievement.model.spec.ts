import { ACHIEVEMENTS, AchievementStats } from './achievement.model';

function baseStats(overrides: Partial<AchievementStats> = {}): AchievementStats {
  return { mastered: 0, started: 0, streak: 0, sessionsCompleted: 0, perfectSessions: 0, ...overrides };
}

function find(id: string) {
  const achievement = ACHIEVEMENTS.find((a) => a.id === id);
  if (!achievement) throw new Error(`Missing achievement fixture: ${id}`);
  return achievement;
}

describe('ACHIEVEMENTS', () => {
  it('has a unique id for every achievement', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('unlocks "first_session" only once a session has been completed', () => {
    const achievement = find('first_session');
    expect(achievement.isUnlocked(baseStats({ sessionsCompleted: 0 }))).toBe(false);
    expect(achievement.isUnlocked(baseStats({ sessionsCompleted: 1 }))).toBe(true);
  });

  it('unlocks streak achievements at their exact threshold, not before', () => {
    const streak7 = find('streak_7');
    expect(streak7.isUnlocked(baseStats({ streak: 6 }))).toBe(false);
    expect(streak7.isUnlocked(baseStats({ streak: 7 }))).toBe(true);
  });

  it('unlocks "perfect_1" only when at least one correct answer was given with zero wrong', () => {
    const achievement = find('perfect_1');
    // The session-completion caller only increments perfectSessions when
    // wrong === 0 AND correct > 0, so a stats snapshot of 1 already encodes that.
    expect(achievement.isUnlocked(baseStats({ perfectSessions: 0 }))).toBe(false);
    expect(achievement.isUnlocked(baseStats({ perfectSessions: 1 }))).toBe(true);
  });

  it('unlocks mastery milestones in ascending order consistently', () => {
    const mastered10 = find('mastered_10');
    const mastered1000 = find('mastered_1000');

    const partial = baseStats({ mastered: 10 });
    expect(mastered10.isUnlocked(partial)).toBe(true);
    expect(mastered1000.isUnlocked(partial)).toBe(false);

    const everything = baseStats({ mastered: 1000 });
    expect(mastered10.isUnlocked(everything)).toBe(true);
    expect(mastered1000.isUnlocked(everything)).toBe(true);
  });

  it('unlocks "started_1000" only once every word has been introduced', () => {
    const achievement = find('started_1000');
    expect(achievement.isUnlocked(baseStats({ started: 999 }))).toBe(false);
    expect(achievement.isUnlocked(baseStats({ started: 1000 }))).toBe(true);
  });
});

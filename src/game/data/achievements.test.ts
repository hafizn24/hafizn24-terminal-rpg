import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, getAchievement } from '../../game/data/achievements';

describe('achievements catalogue', () => {
  it('has 20 entries with hints', () => {
    expect(ACHIEVEMENTS).toHaveLength(20);
    for (const a of ACHIEVEMENTS) {
      expect(a.id.length).toBeGreaterThan(0);
      expect(a.hint.length).toBeGreaterThan(0);
    }
  });

  it('resolves by id', () => {
    expect(getAchievement('first_blood')?.name).toBe('First Blood');
    expect(getAchievement('nope')).toBeUndefined();
  });
});

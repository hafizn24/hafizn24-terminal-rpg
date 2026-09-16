import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  classifyDeath,
  getTelemetrySummary,
  isTelemetryEnabled,
  recordTelemetryEvent,
  setTelemetryEnabled,
} from './telemetry';

describe('telemetry', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  it('is off by default and records nothing until opted in', () => {
    expect(isTelemetryEnabled()).toBe(false);
    recordTelemetryEvent({ t: 'runStarted', classId: 'mage' });
    expect(getTelemetrySummary().runs).toBe(0);
    setTelemetryEnabled(true);
    recordTelemetryEvent({ t: 'runStarted', classId: 'mage' });
    recordTelemetryEvent({ t: 'runEnded', won: false, classId: 'mage', floor: 3, cause: 'trap' });
    const s = getTelemetrySummary();
    expect(s.runs).toBe(1);
    expect(s.deathsByFloor).toEqual([{ floor: 3, deaths: 1 }]);
    expect(s.deathsByCause).toEqual([{ cause: 'trap', deaths: 1 }]);
  });

  it('buckets death messages into countable causes', () => {
    expect(classifyDeath('Killed by a dungeon trap.')).toBe('trap');
    expect(classifyDeath('Succumbed to poison against Wraith.')).toBe('status');
    expect(classifyDeath('Slain by a Volatile Slime burst on floor 6.')).toBe('burst');
    expect(classifyDeath('Defeated by Orc Warrior on floor 4.')).toBe('monster');
  });
});

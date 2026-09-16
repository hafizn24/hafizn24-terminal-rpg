/**
 * Opt-in, local-first telemetry. Default OFF — nothing is recorded until the
 * player flips the switch in Renown. No network, no identifiers: events live
 * in localStorage and the only exfiltration is an explicit JSON export the
 * player downloads. This answers "where is the wall?" (deaths by floor /
 * class / cause) without any tracking infrastructure.
 */

const TELEMETRY_KEY = 'terminal_rpg_telemetry';
const MAX_EVENTS = 500;

export type DeathCause = 'monster' | 'trap' | 'status' | 'burst';

export interface TelemetryEvent {
  t: 'runStarted' | 'runEnded' | 'bossKilled';
  ts: number;
  classId?: string;
  floor?: number;
  won?: boolean;
  level?: number;
  cause?: DeathCause;
  boss?: string;
}

interface TelemetryStore {
  enabled: boolean;
  events: TelemetryEvent[];
}

function read(): TelemetryStore {
  try {
    const json = localStorage.getItem(TELEMETRY_KEY);
    if (!json) return { enabled: false, events: [] };
    const parsed = JSON.parse(json) as Partial<TelemetryStore>;
    return {
      enabled: parsed.enabled === true,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { enabled: false, events: [] };
  }
}

function write(store: TelemetryStore): void {
  try {
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function isTelemetryEnabled(): boolean {
  return read().enabled;
}

export function setTelemetryEnabled(enabled: boolean): void {
  const store = read();
  store.enabled = enabled;
  write(store);
}

export function clearTelemetry(): void {
  write({ enabled: read().enabled, events: [] });
}

/** No-op unless the player opted in. Cap keeps the key small forever. */
export function recordTelemetryEvent(event: Omit<TelemetryEvent, 'ts'>): void {
  const store = read();
  if (!store.enabled) return;
  store.events = [...store.events, { ...event, ts: Date.now() }].slice(-MAX_EVENTS);
  write(store);
}

/** Buckets the free-text death message into a countable cause. Pure. */
export function classifyDeath(message: string): DeathCause {
  const m = message.toLowerCase();
  if (m.includes('trap')) return 'trap';
  if (m.includes('succumbed')) return 'status';
  if (m.includes('burst')) return 'burst';
  return 'monster';
}

export interface TelemetrySummary {
  runs: number;
  wins: number;
  deathsByFloor: { floor: number; deaths: number }[];
  deathsByClass: { classId: string; deaths: number }[];
  deathsByCause: { cause: DeathCause; deaths: number }[];
  bossesKilled: number;
}

export function getTelemetrySummary(): TelemetrySummary {
  const { events } = read();
  const byFloor = new Map<number, number>();
  const byClass = new Map<string, number>();
  const byCause = new Map<DeathCause, number>();
  let runs = 0;
  let wins = 0;
  let bossesKilled = 0;
  for (const e of events) {
    if (e.t === 'runStarted') runs++;
    if (e.t === 'runEnded' && e.won) wins++;
    if (e.t === 'runEnded' && !e.won) {
      if (typeof e.floor === 'number') byFloor.set(e.floor, (byFloor.get(e.floor) ?? 0) + 1);
      if (e.classId) byClass.set(e.classId, (byClass.get(e.classId) ?? 0) + 1);
      if (e.cause) byCause.set(e.cause, (byCause.get(e.cause) ?? 0) + 1);
    }
    if (e.t === 'bossKilled') bossesKilled++;
  }
  const top = <K extends string | number>(m: Map<K, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  return {
    runs,
    wins,
    deathsByFloor: top(byFloor, 5).map(([floor, deaths]) => ({ floor, deaths })),
    deathsByClass: top(byClass, 4).map(([classId, deaths]) => ({ classId, deaths })),
    deathsByCause: top(byCause, 4).map(([cause, deaths]) => ({ cause, deaths })),
    bossesKilled,
  };
}

/** Explicit player-initiated export — a file download, nothing else. */
export function exportTelemetryJSON(): void {
  try {
    const store = read();
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...store }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminal-rpg-field-reports.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

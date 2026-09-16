/**
 * Synthesized SFX — zero asset pipeline. A terminal game has no business
 * shipping MP3s for blips: a handful of oscillator envelopes transform
 * perceived production value for ~100 lines.
 *
 * Autoplay-safe: the AudioContext is created lazily inside the first play()
 * call, which always follows a user gesture. Everything is try/catch — audio
 * must never break the game. Honors the persisted mute flag.
 */

export type SfxName =
  | 'hit'
  | 'crit'
  | 'skill'
  | 'victory'
  | 'defeat'
  | 'levelup'
  | 'gold'
  | 'trap'
  | 'treasure'
  | 'rest'
  | 'relic'
  | 'boss'
  | 'click';

const MUTE_KEY = 'terminal_rpg_muted';
const MASTER_GAIN = 0.12;

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

interface Tone {
  freq: number;
  end?: number;
  dur: number;
  type: OscillatorType;
  delay?: number;
}

const SCORES: Record<SfxName, Tone[]> = {
  hit: [{ freq: 220, end: 180, dur: 0.08, type: 'square' }],
  crit: [
    { freq: 330, end: 110, dur: 0.15, type: 'square' },
    { freq: 660, end: 220, dur: 0.12, type: 'square', delay: 0.05 },
  ],
  skill: [{ freq: 440, end: 880, dur: 0.12, type: 'sawtooth' }],
  victory: [
    { freq: 523, dur: 0.1, type: 'triangle' },
    { freq: 659, dur: 0.1, type: 'triangle', delay: 0.1 },
    { freq: 784, dur: 0.2, type: 'triangle', delay: 0.2 },
  ],
  defeat: [{ freq: 220, end: 55, dur: 0.6, type: 'square' }],
  levelup: [
    { freq: 523, dur: 0.08, type: 'triangle' },
    { freq: 784, dur: 0.08, type: 'triangle', delay: 0.08 },
    { freq: 1046, dur: 0.16, type: 'triangle', delay: 0.16 },
  ],
  gold: [
    { freq: 880, dur: 0.05, type: 'sine' },
    { freq: 1320, dur: 0.07, type: 'sine', delay: 0.05 },
  ],
  trap: [{ freq: 150, end: 60, dur: 0.2, type: 'sawtooth' }],
  treasure: [{ freq: 660, end: 990, dur: 0.15, type: 'sine' }],
  rest: [{ freq: 392, end: 523, dur: 0.3, type: 'sine' }],
  relic: [{ freq: 784, end: 1046, dur: 0.2, type: 'triangle' }],
  boss: [{ freq: 110, end: 82, dur: 0.4, type: 'square' }],
  click: [{ freq: 600, dur: 0.03, type: 'square' }],
};

export function playSfx(name: SfxName): void {
  try {
    if (isMuted()) return;
    const ac = audio();
    if (!ac) return;
    const master = ac.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ac.destination);
    const t0 = ac.currentTime;
    for (const tone of SCORES[name]) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = tone.type;
      const start = t0 + (tone.delay ?? 0);
      osc.frequency.setValueAtTime(tone.freq, start);
      if (tone.end) osc.frequency.exponentialRampToValueAtTime(Math.max(1, tone.end), start + tone.dur);
      gain.gain.setValueAtTime(1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + tone.dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + tone.dur + 0.02);
    }
  } catch {
    /* audio must never break the game */
  }
}

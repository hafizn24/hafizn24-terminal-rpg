/** First-run tutorial flag — local only. */
const KEY = 'terminal_rpg_tutorial_done';

export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true;
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
}

export function resetTutorial(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

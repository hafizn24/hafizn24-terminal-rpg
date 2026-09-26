/**
 * Debounced save queue — coalesces rapid save() calls (e.g. trap spam,
 * bulk loot) into at most one localStorage write per 500ms.
 * Victory/descend/death call `flushSave()` via the store's `save()` directly.
 */
let pending = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSave(save: () => boolean): void {
  if (pending) return;
  pending = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    pending = false;
    timer = null;
    try {
      save();
    } catch {
      /* save() already handles errors */
    }
  }, 500);
}

export function cancelScheduledSave(): void {
  pending = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

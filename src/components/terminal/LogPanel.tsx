import { useUIStore } from '../../game/store/uiStore';

/**
 * Minimal single-line log: shows only the latest event, truncated.
 * Fixed height — never expands or pushes layout.
 */
export function LogPanel() {
  const logMessages = useUIStore((s) => s.logMessages);
  const clearLogs = useUIStore((s) => s.clearLogs);

  const latest = logMessages.length > 0 ? logMessages[logMessages.length - 1] : null;

  return (
    <div className="border border-terminal-dim/40 px-2 h-7 flex items-center gap-2 overflow-hidden">
      <span className="text-terminal-green font-mono text-xs shrink-0">&gt;</span>
      <span className="flex-1 text-terminal-dim text-xs truncate whitespace-nowrap overflow-hidden" aria-live="polite">
        {latest ? latest.text : 'No events yet...'}
      </span>
      <button
        onClick={clearLogs}
        className="text-terminal-dim text-[10px] hover:text-terminal-green shrink-0"
        aria-label="Clear log"
      >
        [x]
      </button>
    </div>
  );
}

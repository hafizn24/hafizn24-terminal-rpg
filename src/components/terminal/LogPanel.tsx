import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../../game/store/uiStore';
import type { LogMessage } from '../../types/game';

const typeColors: Record<string, string> = {
  info: 'text-terminal-dim',
  combat: 'text-terminal-red',
  loot: 'text-terminal-yellow',
  danger: 'text-terminal-red',
  system: 'text-terminal-cyan',
};

type LogFilter = 'all' | 'combat' | 'loot' | 'system';

function matchesFilter(type: LogMessage['type'], filter: LogFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'combat') return type === 'combat' || type === 'danger';
  if (filter === 'loot') return type === 'loot';
  return type === 'system' || type === 'info';
}

const FILTERS: { id: LogFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'combat', label: 'Fight' },
  { id: 'loot', label: 'Loot' },
  { id: 'system', label: 'Sys' },
];

export function LogPanel() {
  const logMessages = useUIStore((s) => s.logMessages);
  const clearLogs = useUIStore((s) => s.clearLogs);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<LogFilter>('all');
  const [expanded, setExpanded] = useState(false);

  // Always pinned to the latest log, instantly (no smooth animation).
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logMessages, filter, expanded]);

  const visible = logMessages.filter((msg) => matchesFilter(msg.type, filter));

  return (
    <div className="border border-terminal-dim bg-terminal-panel">
      <div className="flex items-center justify-between gap-2 px-2 pt-1.5 text-[10px] font-mono">
        <div className="flex gap-1" role="tablist" aria-label="Log filter">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`px-1.5 py-0.5 border ${
                filter === f.id
                  ? 'border-terminal-cyan text-terminal-cyan'
                  : 'border-terminal-dim/30 text-terminal-dim hover:text-terminal-green'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 text-terminal-dim">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="hover:text-terminal-green"
            aria-label={expanded ? 'Collapse log' : 'Expand log'}
          >
            {expanded ? '[-]' : '[+]'}
          </button>
          <button onClick={clearLogs} className="hover:text-terminal-green" aria-label="Clear log">
            [Clear]
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className={`p-2 overflow-y-auto text-xs font-mono ${expanded ? 'max-h-64' : 'max-h-32'}`}
        aria-live="polite"
      >
        {visible.length === 0 && (
          <div className="text-terminal-dim italic">No events yet...</div>
        )}
        {visible.map((msg) => (
          <div key={msg.id} className={`${typeColors[msg.type]} animate-fade-in`}>
            <span className="text-terminal-dim mr-2">&gt;</span>
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

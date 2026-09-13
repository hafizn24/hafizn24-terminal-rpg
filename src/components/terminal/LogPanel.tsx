import { useEffect, useRef } from 'react';
import { useUIStore } from '../../game/store/uiStore';

const typeColors: Record<string, string> = {
  info: 'text-terminal-dim',
  combat: 'text-terminal-red',
  loot: 'text-terminal-yellow',
  danger: 'text-terminal-red',
  system: 'text-terminal-cyan',
};

export function LogPanel() {
  const logMessages = useUIStore((s) => s.logMessages);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logMessages]);

  return (
    <div className="border border-terminal-dim bg-terminal-panel p-2 max-h-32 overflow-y-auto text-xs font-mono" aria-live="polite">
      {logMessages.length === 0 && (
        <div className="text-terminal-dim italic">No events yet...</div>
      )}
      {logMessages.map((msg) => (
        <div key={msg.id} className={`${typeColors[msg.type]} animate-fade-in`}>
          <span className="text-terminal-dim mr-2">&gt;</span>
          {msg.text}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

import type { ReactNode } from 'react';

interface TerminalWindowProps {
  title?: string;
  children: ReactNode;
}

export function TerminalWindow({ title = 'Terminal RPG v0.2', children }: TerminalWindowProps) {
  return (
    <div className="h-screen w-screen flex flex-col bg-terminal-bg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-terminal-dim bg-terminal-panel">
        <div className="flex items-center gap-2">
          <span className="text-terminal-red text-lg">●</span>
          <span className="text-terminal-yellow text-lg">●</span>
          <span className="text-terminal-green text-lg">●</span>
        </div>
        <span className="text-terminal-dim text-xs tracking-widest uppercase">
          {title}
        </span>
        <div className="w-14" />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto p-4 pb-20">
          {children}
        </div>
        <div className="scanlines absolute inset-0" />
      </div>
      <div className="scanline-sweep" />
    </div>
  );
}

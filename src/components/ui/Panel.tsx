import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <div className={`border border-terminal-border bg-terminal-panel p-3 ${className}`}>
      {title && (
        <div className="border-b border-terminal-dim pb-1 mb-2">
          <span className="text-terminal-cyan text-xs uppercase tracking-widest">
            {'[ '}{title}{' ]'}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

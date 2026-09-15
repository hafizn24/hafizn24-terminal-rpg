import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleAlign?: 'left' | 'center';
}

export function Panel({ title, children, className = '', titleAlign = 'left' }: PanelProps) {
  return (
    <div className={`border border-terminal-border bg-terminal-panel p-3 ${className}`}>
      {title && (
        <div className={`border-b border-terminal-dim pb-1 mb-2 ${titleAlign === 'center' ? 'text-center' : ''}`}>
          <span className="text-terminal-cyan text-xs uppercase tracking-widest">
            {'[ '}{title}{' ]'}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

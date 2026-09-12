import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  className = '',
  ...props
}: ButtonProps) {
  const base = 'font-mono uppercase tracking-wider transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'border border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-terminal-bg',
    danger:
      'border border-terminal-red text-terminal-red hover:bg-terminal-red hover:text-terminal-bg',
    ghost:
      'border border-transparent text-terminal-dim hover:text-terminal-green hover:border-terminal-green',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const glowClass = glow ? 'animate-pulse-glow' : '';

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

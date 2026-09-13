
interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  color?: 'green' | 'red' | 'cyan' | 'yellow';
  showText?: boolean;
}

export function ProgressBar({
  current,
  max,
  label,
  color = 'green',
  showText = true,
}: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const filled = Math.floor(percentage / 5);
  const empty = 20 - filled;

  const colors = {
    green: 'text-terminal-green',
    red: 'text-terminal-red',
    cyan: 'text-terminal-cyan',
    yellow: 'text-terminal-yellow',
  };

  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      {label && <span className="text-terminal-dim w-8">{label}</span>}
      <span className={colors[color]}>{bar}</span>
      {showText && (
        <span className="text-terminal-dim">
          {current}/{max}
        </span>
      )}
    </div>
  );
}

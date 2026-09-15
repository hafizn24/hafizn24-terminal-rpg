
interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  color?: 'green' | 'red' | 'cyan' | 'yellow';
  showText?: boolean;
  /** Bar length in chars (default 20). Footers pass a shorter value. */
  length?: number;
}

export function ProgressBar({
  current,
  max,
  label,
  color = 'green',
  showText = true,
  length = 20,
}: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const filled = Math.floor((percentage / 100) * length);
  const empty = length - filled;

  const colors = {
    green: 'text-terminal-green',
    red: 'text-terminal-red',
    cyan: 'text-terminal-cyan',
    yellow: 'text-terminal-yellow',
  };

  // Empty shade renders in dim (not the bright color) so the ░ pattern
  // doesn't shimmer/bleed against the scanline overlay on narrow screens.
  return (
    <div className="flex items-center gap-2 text-xs font-mono whitespace-nowrap overflow-hidden leading-none">
      {label && <span className="text-terminal-dim w-8 shrink-0">{label}</span>}
      <span className="truncate" aria-hidden="true">
        <span className={colors[color]}>{'\u2588'.repeat(filled)}</span>
        <span className="text-terminal-dim/40">{'\u2591'.repeat(empty)}</span>
      </span>
      {showText && (
        <span className="text-terminal-dim shrink-0">
          {current}/{max}
        </span>
      )}
    </div>
  );
}

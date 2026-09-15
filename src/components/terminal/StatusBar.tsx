import { useGameStore } from '../../game/store/gameStore';
import { ProgressBar } from '../ui/ProgressBar';

export function StatusBar() {
  const player = useGameStore((s) => s.player);

  if (!player) return null;

  const classColors: Record<string, string> = {
    warrior: 'text-terminal-red',
    mage: 'text-terminal-cyan',
    rogue: 'text-terminal-yellow',
    cleric: 'text-terminal-green',
  };

  // Compact two-row footer: no horizontal scroll, short 10-char bars,
  // everything truncated so nothing bleeds off narrow screens.
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-terminal-panel border-t border-terminal-border px-3 py-1.5 z-50">
      <div className="max-w-md mx-auto flex flex-col gap-0.5 text-[11px] font-mono leading-none">
        <div className="flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
          <div className="truncate">
            <span className={classColors[player.class] || 'text-terminal-green'}>
              {player.name.toUpperCase()}
            </span>
            <span className="text-terminal-dim"> LV.{player.level} {player.class.toUpperCase()}</span>
          </div>
          <div className="shrink-0">
            <span className="text-terminal-yellow">{player.gold}g</span>
            <span className="text-terminal-dim"> · F{player.floor} · {player.exp}/{player.expToNext} XP</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <ProgressBar current={player.stats.hp} max={player.stats.maxHp} label="HP" color="red" length={10} />
          </div>
          <div className="flex-1 min-w-0">
            <ProgressBar current={player.stats.mp} max={player.stats.maxMp} label="MP" color="cyan" length={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

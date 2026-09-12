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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-terminal-panel border-t border-terminal-border px-4 py-2 z-50">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-mono">
        <span className={classColors[player.class] || 'text-terminal-green'}>
          {player.name.toUpperCase()}
        </span>
        <span className="text-terminal-dim">LV.{player.level}</span>
        <span className="text-terminal-dim uppercase">{player.class}</span>

        <div className="flex-1 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-terminal-red">HP</span>
            <ProgressBar
              current={player.stats.hp}
              max={player.stats.maxHp}
              color="red"
              showText={true}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-terminal-cyan">MP</span>
            <ProgressBar
              current={player.stats.mp}
              max={player.stats.maxMp}
              color="cyan"
              showText={true}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-terminal-yellow">GOLD: {player.gold}</span>
          <span className="text-terminal-dim">FLOOR: {player.floor}</span>
          <span className="text-terminal-dim">EXP: {player.exp}/{player.expToNext}</span>
        </div>
      </div>
    </div>
  );
}

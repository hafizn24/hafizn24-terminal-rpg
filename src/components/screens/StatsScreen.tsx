import { useGameStore } from '../../game/store/gameStore';
import { Button } from '../ui/Button';
import { StatAllocationPanel } from '../ui/StatAllocationPanel';

/**
 * Dedicated stats screen — the only place stat points are distributed.
 * Town and Inventory link here instead of embedding the panel inline,
 * keeping those screens minimal and single-purpose.
 */
export function StatsScreen() {
  const player = useGameStore((s) => s.player);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!player) return null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-cyan text-lg tracking-widest uppercase">
          Stats
        </h1>
        <Button variant="ghost" size="sm" onClick={() => setScreen('town')}>
          [Back to Town]
        </Button>
      </div>
      <StatAllocationPanel />
    </div>
  );
}

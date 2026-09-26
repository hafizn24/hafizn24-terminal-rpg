import { useEffect } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useMetaStore } from '../../game/store/metaStore';
import { useUIStore } from '../../game/store/uiStore';
import { META_UPGRADES } from '../../game/data/meta';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

/**
 * Renown — permanent cross-run unlocks bought with shards earned by
 * descending and killing bosses. Earned only through play, never sold.
 */
export function MetaScreen() {
  const player = useGameStore((s) => s.player);
  const setScreen = useGameStore((s) => s.setScreen);
  const shards = useMetaStore((s) => s.shards);
  const upgrades = useMetaStore((s) => s.upgrades);
  const refresh = useMetaStore((s) => s.refresh);
  const buyUpgrade = useMetaStore((s) => s.buyUpgrade);
  const addLog = useUIStore((s) => s.addLog);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleBuy = (id: string, name: string) => {
    const ok = buyUpgrade(id);
    addLog(ok ? `${name} upgraded. Applies to your next run.` : 'Not enough shards — delve deeper.', ok ? 'loot' : 'danger');
  };

  return (
    <div className="flex flex-col gap-3 animate-fade-in max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-yellow text-lg tracking-widest uppercase">Renown</h1>
        <Button variant="ghost" size="sm" onClick={() => setScreen(player ? 'town' : 'title')}>
          {player ? '[Back to Town]' : '[Back to Title]'}
        </Button>
      </div>

      <Panel title={`War shards: ${shards}`} titleAlign="center">
        <div className="text-[11px] text-terminal-dim mb-2">
          Earned by descending (+1/floor) and slaying bosses (+10). Death pays out — every run feeds the next.
        </div>
        <div className="flex flex-col gap-2">
          {META_UPGRADES.map((u) => {
            const rank = upgrades[u.id] ?? 0;
            const maxed = rank >= u.maxRank;
            const cost = maxed ? null : u.costs[rank];
            return (
              <div key={u.id} className="flex items-center justify-between border-b border-terminal-dim/30 pb-2">
                <div className="flex-1">
                  <div className="text-terminal-green text-sm">
                    {u.name}{' '}
                    <span className="text-terminal-dim text-[11px]">
                      {rank}/{u.maxRank}
                    </span>
                  </div>
                  <div className="text-terminal-dim text-[10px]">{u.description}</div>
                </div>
                <Button
                  size="sm"
                  variant={maxed ? 'ghost' : 'primary'}
                  disabled={maxed || (cost !== null && shards < cost)}
                  onClick={() => handleBuy(u.id, u.name)}
                  aria-label={maxed ? `${u.name} maxed` : `Buy ${u.name} rank ${rank + 1} for ${cost} shards`}
                >
                  {maxed ? 'MAX' : `${cost}◆`}
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

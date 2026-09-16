import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useMetaStore } from '../../game/store/metaStore';
import { BOSS_ENEMIES, ENEMIES } from '../../game/data/enemies';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

/**
 * Bestiary — the enemy ASCII art already in the data files, surfaced as a
 * collection loop. Entries unlock on first kill (kills tracked in meta).
 */
export function BestiaryScreen() {
  const player = useGameStore((s) => s.player);
  const setScreen = useGameStore((s) => s.setScreen);
  const kills = useMetaStore((s) => s.kills);
  const refresh = useMetaStore((s) => s.refresh);
  const [showBosses, setShowBosses] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const list = showBosses ? BOSS_ENEMIES : ENEMIES;
  const unlocked = list.filter((e) => (kills[e.id] ?? 0) > 0).length;

  return (
    <div className="flex flex-col gap-3 animate-fade-in max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-cyan text-lg tracking-widest uppercase">Bestiary</h1>
        <Button variant="ghost" size="sm" onClick={() => setScreen(player ? 'town' : 'title')}>
          {player ? '[Back to Town]' : '[Back to Title]'}
        </Button>
      </div>

      <div className="flex gap-1">
        <Button size="sm" variant={!showBosses ? 'primary' : 'ghost'} onClick={() => setShowBosses(false)}>
          Foes ({ENEMIES.length})
        </Button>
        <Button size="sm" variant={showBosses ? 'primary' : 'ghost'} onClick={() => setShowBosses(true)}>
          Bosses ({BOSS_ENEMIES.length})
        </Button>
      </div>

      <div className="text-[11px] text-terminal-dim">
        Unlocked {unlocked}/{list.length} — slay it to record it.
      </div>

      <div className="flex flex-col gap-2">
        {list.map((e) => {
          const n = kills[e.id] ?? 0;
          const known = n > 0;
          return (
            <Panel key={e.id} title={known ? `${e.name} ×${n}` : '??? — undiscovered'}>
              {known ? (
                <>
                  <pre className="text-terminal-green text-[9px] leading-tight overflow-x-auto">{e.ascii}</pre>
                  <div className="text-[11px] text-terminal-dim mt-1">
                    ATK {e.attack} · DEF {e.defense} · HP {e.stats.maxHp} · EXP {e.expReward} · Gold {e.goldReward}
                  </div>
                  {e.skills.length > 0 && (
                    <div className="text-[11px] text-terminal-yellow mt-1">
                      Skills: {e.skills.map((s) => s.name).join(', ')}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-terminal-dim text-xs italic">
                  {showBosses ? 'A terror lurks on its boss floor…' : 'Undiscovered. Keep descending.'}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

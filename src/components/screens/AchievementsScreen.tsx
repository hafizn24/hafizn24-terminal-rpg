import { useEffect } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useMetaStore } from '../../game/store/metaStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { ACHIEVEMENTS } from '../../game/data/achievements';

export function AchievementsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const refresh = useMetaStore((s) => s.refresh);
  const achievements = useMetaStore((s) => s.achievements);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlocked = new Set(achievements);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-cyan text-lg tracking-widest uppercase">[Achievements]</h1>
        <Button variant="ghost" size="sm" onClick={() => setScreen('town')}>
          [Back to Town]
        </Button>
      </div>
      <div className="text-[11px] text-terminal-dim">
        {unlocked.size}/{ACHIEVEMENTS.length} unlocked · local only, earned through play.
      </div>
      <Panel title="Collection">
        <div className="space-y-2">
          {ACHIEVEMENTS.map((a) => {
            const has = unlocked.has(a.id);
            return (
              <div key={a.id} className="flex items-center justify-between border-b border-terminal-dim/30 pb-2">
                <div className="flex-1">
                  <div className={has ? 'text-terminal-yellow' : 'text-terminal-dim'}>
                    {has ? a.name : '???'}
                  </div>
                  <div className="text-terminal-dim text-[10px]">{has ? a.description : a.hint}</div>
                </div>
                <span className={has ? 'text-terminal-green text-xs' : 'text-terminal-dim text-xs'}>
                  {has ? '[X]' : '[ ]'}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

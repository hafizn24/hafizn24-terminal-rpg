import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useMetaStore } from '../../game/store/metaStore';
import { useUIStore } from '../../game/store/uiStore';
import { META_UPGRADES } from '../../game/data/meta';
import {
  clearTelemetry,
  exportTelemetryJSON,
  getTelemetrySummary,
  isTelemetryEnabled,
  setTelemetryEnabled,
  type TelemetrySummary,
} from '../../utils/telemetry';
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

  const [telemetryOn, setTelemetryOn] = useState(() => isTelemetryEnabled());
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);

  useEffect(() => {
    refresh();
    if (isTelemetryEnabled()) setSummary(getTelemetrySummary());
  }, [refresh]);

  const handleTelemetryToggle = () => {
    const next = !telemetryOn;
    setTelemetryEnabled(next);
    setTelemetryOn(next);
    setSummary(next ? getTelemetrySummary() : null);
    addLog(next ? 'Field reports enabled — runs are recorded locally.' : 'Field reports disabled.', 'system');
  };

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

      <Panel title="Field reports (opt-in)" titleAlign="center">
        <div className="text-[11px] text-terminal-dim mb-2">
          Local-only telemetry: deaths by floor, class, and cause. Off by default, no network — export is a file you
          download.
        </div>
        <div className="flex gap-2 mb-2 flex-wrap">
          <Button size="sm" variant={telemetryOn ? 'primary' : 'ghost'} onClick={handleTelemetryToggle}>
            {telemetryOn ? 'Reporting: on' : 'Reporting: off'}
          </Button>
          {telemetryOn && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  exportTelemetryJSON();
                  addLog('Field reports exported as JSON.', 'system');
                }}
              >
                Export JSON
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  clearTelemetry();
                  setSummary(getTelemetrySummary());
                  addLog('Field reports cleared.', 'system');
                }}
              >
                Clear
              </Button>
            </>
          )}
        </div>
        {telemetryOn && summary && (
          <div className="text-[11px] text-terminal-dim space-y-0.5">
            <div>
              Runs: <span className="text-terminal-cyan">{summary.runs}</span> · Summit: <span className="text-terminal-cyan">{summary.wins}</span> · Bosses:{' '}
              <span className="text-terminal-cyan">{summary.bossesKilled}</span>
            </div>
            {summary.deathsByFloor.length > 0 && (
              <div>
                Deadliest floors:{' '}
                <span className="text-terminal-yellow">
                  {summary.deathsByFloor.map((d) => `F${d.floor}×${d.deaths}`).join(' ')}
                </span>
              </div>
            )}
            {summary.deathsByCause.length > 0 && (
              <div>
                Causes:{' '}
                <span className="text-terminal-yellow">
                  {summary.deathsByCause.map((d) => `${d.cause}×${d.deaths}`).join(' ')}
                </span>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

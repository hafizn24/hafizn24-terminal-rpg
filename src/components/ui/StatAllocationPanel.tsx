import { useGameStore, HP_PER_STAT_POINT, MP_PER_STAT_POINT } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from './Button';
import { Panel } from './Panel';
import { calcCritChance } from '../../utils/rng';
import type { StatType } from '../../types/game';

const ROWS: { id: StatType; label: string; hint: string }[] = [
  { id: 'str', label: 'STR', hint: '+1 attack (Warrior)' },
  { id: 'dex', label: 'DEX', hint: '+crit/dodge (+1 atk Rogue)' },
  { id: 'int', label: 'INT', hint: '+skill dmg (+1 atk Mage/Cleric)' },
  { id: 'hp', label: 'HP', hint: `+${HP_PER_STAT_POINT} max` },
  { id: 'mp', label: 'MP', hint: `+${MP_PER_STAT_POINT} max` },
  { id: 'def', label: 'DEF', hint: '+1 defense' },
];

export function StatAllocationPanel() {
  const player = useGameStore((s) => s.player);
  const allocateStatPoint = useGameStore((s) => s.allocateStatPoint);
  const save = useGameStore((s) => s.save);
  const addLog = useUIStore((s) => s.addLog);

  if (!player) return null;

  const points = player.statPoints ?? 0;
  const primary: 'str' | 'dex' | 'int' =
    player.class === 'rogue' ? 'dex' : player.class === 'mage' || player.class === 'cleric' ? 'int' : 'str';
  const gearOffense =
    (player.equipment.weapon?.statBonus?.str || 0) +
    (player.equipment.weapon?.statBonus?.dex || 0) +
    (player.equipment.weapon?.statBonus?.int || 0) +
    (player.equipment.accessory?.statBonus?.str || 0) +
    (player.equipment.accessory?.statBonus?.dex || 0) +
    (player.equipment.accessory?.statBonus?.int || 0);
  const atkBonus = gearOffense;
  const atkBase = player.stats[primary];
  const defBonus =
    (player.stats.def ?? 0) +
    (player.equipment.armor?.statBonus?.def || 0) +
    (player.equipment.accessory?.statBonus?.def || 0);
  const crit = Math.round(
    calcCritChance(player.stats.dex + (player.equipment.accessory?.statBonus?.dex || 0)) * 100
  );

  const handleAllocate = (stat: StatType) => {
    const ok = allocateStatPoint(stat);
    if (!ok) {
      addLog('No stat points to spend — level up to earn more.', 'info');
      return;
    }
    save();
    addLog(`Allocated 1 point to ${stat.toUpperCase()}.`, 'system');
  };

  return (
    <Panel title={`Stats${points > 0 ? ` — ${points} point${points === 1 ? '' : 's'} to spend!` : ''}`}>
      <div className="text-[11px] text-terminal-dim mb-2">
        ATK {atkBase + atkBonus} · DEF {defBonus} · CRIT {crit}% · Level {player.level} (
        {player.exp}/{player.expToNext} EXP)
        {points > 0 ? (
          <span className="text-terminal-yellow"> — distribute your bonus points below.</span>
        ) : (
          <span> — level up to earn +3 points per level.</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
        {ROWS.map((row) => {
          const value =
            row.id === 'hp'
              ? `${player.stats.hp}/${player.stats.maxHp}`
              : row.id === 'mp'
                ? `${player.stats.mp}/${player.stats.maxMp}`
                : String(player.stats[row.id]);
          return (
            <div
              key={row.id}
              className={`flex items-center justify-between border px-2 py-1.5 ${
                points > 0 ? 'border-terminal-yellow/50' : 'border-terminal-dim/30'
              }`}
            >
              <div>
                <span className="text-terminal-green font-bold mr-2">{row.label}</span>
                <span className="text-terminal-cyan">{value}</span>
                <span className="text-terminal-dim text-[10px] ml-2">{row.hint}</span>
              </div>
              <Button
                size="sm"
                variant={points > 0 ? 'primary' : 'ghost'}
                disabled={points <= 0}
                onClick={() => handleAllocate(row.id)}
                aria-label={`Add point to ${row.label}`}
              >
                [+]
              </Button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

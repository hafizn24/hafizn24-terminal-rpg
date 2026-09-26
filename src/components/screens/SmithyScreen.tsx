import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { getRarityColor } from '../../utils/rng';
import { playSfx } from '../../utils/audio';
import { canEnchantType, enchantCost, getEnchantLevel, MAX_ENCHANT_LEVEL } from '../../engine/rules/enchant';

export function SmithyScreen() {
  const player = useGameStore((s) => s.player);
  const setScreen = useGameStore((s) => s.setScreen);
  const enchantItem = useGameStore((s) => s.enchantItem);
  const addLog = useUIStore((s) => s.addLog);

  if (!player) return null;

  const gear = player.inventory.filter((s) => canEnchantType(s.item.type));

  const handleEnchant = (itemId: string) => {
    const res = enchantItem(itemId);
    addLog(res.message, res.ok ? 'loot' : 'danger');
    if (res.ok) playSfx('enchant');
    else playSfx('click');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-cyan text-lg tracking-widest uppercase">[Smithy]</h1>
        <Button variant="ghost" size="sm" onClick={() => setScreen('town')}>
          [Back to Town]
        </Button>
      </div>
      <div className="text-[11px] text-terminal-dim">
        Temper weapons & armor to +{MAX_ENCHANT_LEVEL}. Cost: 100g × 2^level. Each level: +2 ATK / +1 DEF.
      </div>
      <div className="text-xs text-terminal-yellow">Gold: {player.gold}</div>
      <Panel title={`Forge (${gear.length})`}>
        {gear.length === 0 ? (
          <div className="text-terminal-dim text-xs italic">No enchantable gear. Buy a sword or armor first.</div>
        ) : (
          <div className="space-y-2">
            {gear.map((slot) => {
              const level = getEnchantLevel(slot.instanceData);
              const maxed = level >= MAX_ENCHANT_LEVEL;
              const cost = enchantCost(level);
              const afford = player.gold >= cost;
              return (
                <div key={slot.item.id} className="flex items-center justify-between border-b border-terminal-dim/30 pb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ color: getRarityColor(slot.item.rarity) }}>{slot.item.name}</span>
                      <span className="text-terminal-cyan text-[11px]">+{level}</span>
                      {slot.quantity > 1 && <span className="text-terminal-yellow text-xs">x{slot.quantity}</span>}
                    </div>
                    <div className="text-terminal-dim text-[10px]">
                      {maxed ? 'MASTERWORK — maxed.' : `Next: +${level + 1} (+2 ATK/+1 DEF) for ${cost}g`}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleEnchant(slot.item.id)} disabled={maxed || !afford}>
                    {maxed ? 'MAX' : `${cost}g`}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

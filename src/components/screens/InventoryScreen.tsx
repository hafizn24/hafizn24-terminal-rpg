import { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { getRarityColor } from '../../utils/rng';

type Tab = 'all' | 'equipment' | 'consumables' | 'misc';

export function InventoryScreen() {
  const { player, updatePlayer, setScreen } = useGameStore();
  const addLog = useUIStore((s) => s.addLog);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  if (!player) return null;

  const filteredItems = player.inventory.filter((slot) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'equipment') return slot.item.type === 'weapon' || slot.item.type === 'armor';
    if (activeTab === 'consumables') return slot.item.type === 'potion';
    if (activeTab === 'misc') return slot.item.type === 'misc' || slot.item.type === 'key';
    return true;
  });

  const handleEquip = (itemId: string) => {
    const slot = player.inventory.find((s) => s.item.id === itemId);
    if (!slot) return;
    const item = slot.item;

    let equipSlot: 'weapon' | 'armor' | null = null;
    if (item.type === 'weapon') equipSlot = 'weapon';
    else if (item.type === 'armor') equipSlot = 'armor';
    if (!equipSlot) return;

    const newEquipment = { ...player.equipment };
    if (newEquipment[equipSlot]?.id === itemId) {
      newEquipment[equipSlot] = null;
      addLog(`Unequipped ${item.name}.`, 'info');
    } else {
      newEquipment[equipSlot] = item;
      addLog(`Equipped ${item.name}.`, 'info');
    }
    updatePlayer({ equipment: newEquipment });
  };

  const handleUse = (itemId: string) => {
    const slot = player.inventory.find((s) => s.item.id === itemId);
    if (!slot || slot.item.type !== 'potion') return;

    const newStats = { ...player.stats };
    let logMsg = '';

    if (slot.item.healAmount) {
      const healed = Math.min(slot.item.healAmount, newStats.maxHp - newStats.hp);
      newStats.hp = Math.min(newStats.maxHp, newStats.hp + slot.item.healAmount);
      logMsg = `Used ${slot.item.name}. Healed ${healed} HP.`;
    } else if (slot.item.mpRestoreAmount) {
      const restored = Math.min(slot.item.mpRestoreAmount, newStats.maxMp - newStats.mp);
      newStats.mp = Math.min(newStats.maxMp, newStats.mp + slot.item.mpRestoreAmount);
      logMsg = `Used ${slot.item.name}. Restored ${restored} MP.`;
    }

    const newInv = player.inventory
      .map((s) => (s.item.id === itemId ? { ...s, quantity: s.quantity - 1 } : s))
      .filter((s) => s.quantity > 0);

    updatePlayer({ stats: newStats, inventory: newInv });
    addLog(logMsg, 'loot');
  };

  const handleDrop = (itemId: string) => {
    const newInv = player.inventory
      .map((s) => (s.item.id === itemId ? { ...s, quantity: s.quantity - 1 } : s))
      .filter((s) => s.quantity > 0);
    updatePlayer({ inventory: newInv });
    addLog('Item dropped.', 'info');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'consumables', label: 'Potions' },
    { id: 'misc', label: 'Misc' },
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-cyan text-lg tracking-widest uppercase">
          Inventory
        </h1>
        <Button variant="ghost" size="sm" onClick={() => setScreen('town')}>
          {'[Back to Town]'}
        </Button>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeTab === tab.id ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Panel title="Equipment">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-terminal-dim">Weapon: </span>
            <span style={{ color: player.equipment.weapon ? getRarityColor(player.equipment.weapon.rarity) : undefined }}>
              {player.equipment.weapon?.name || 'None'}
            </span>
          </div>
          <div>
            <span className="text-terminal-dim">Armor: </span>
            <span style={{ color: player.equipment.armor ? getRarityColor(player.equipment.armor.rarity) : undefined }}>
              {player.equipment.armor?.name || 'None'}
            </span>
          </div>
          <div>
            <span className="text-terminal-dim">Accessory: </span>
            <span className="text-terminal-dim">None</span>
          </div>
        </div>
      </Panel>

      <Panel title={`Items (${player.inventory.length})`}>
        {filteredItems.length === 0 ? (
          <div className="text-terminal-dim text-xs italic">No items.</div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((slot) => (
              <div
                key={slot.item.id}
                className="flex items-center justify-between border-b border-terminal-dim/30 pb-2"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ color: getRarityColor(slot.item.rarity) }}>
                      {slot.item.name}
                    </span>
                    <span className="text-terminal-dim text-[10px] uppercase">
                      [{slot.item.rarity}]
                    </span>
                    {slot.quantity > 1 && (
                      <span className="text-terminal-yellow text-xs">x{slot.quantity}</span>
                    )}
                  </div>
                  <div className="text-terminal-dim text-[10px]">{slot.item.description}</div>
                </div>
                <div className="flex gap-1 ml-2">
                  {(slot.item.type === 'weapon' || slot.item.type === 'armor') && (
                    <Button size="sm" onClick={() => handleEquip(slot.item.id)}>
                      {player.equipment[slot.item.type === 'weapon' ? 'weapon' : 'armor']?.id === slot.item.id
                        ? 'Unequip'
                        : 'Equip'}
                    </Button>
                  )}
                  {slot.item.type === 'potion' && (
                    <Button size="sm" onClick={() => handleUse(slot.item.id)}>
                      Use
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => handleDrop(slot.item.id)}>
                    Drop
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

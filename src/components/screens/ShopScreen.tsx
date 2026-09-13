import { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import type { ShopType } from '../../game/store/gameStore';
import { useUIStore } from '../../game/store/uiStore';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { ITEMS, SHOP_STOCK } from '../../game/data/items';
import { getRarityColor } from '../../utils/rng';
import type { Item } from '../../types/game';

type ShopMode = 'buy' | 'sell';

const SHOP_NAMES: Record<ShopType, string> = {
  blacksmith: 'Blacksmith',
  potion_shop: 'Potion Shop',
  magic_shop: 'Magic Shop',
};

const SHOP_ICONS: Record<ShopType, string> = {
  blacksmith: 'S',
  potion_shop: 'P',
  magic_shop: 'M',
};

const ACCESSORY_IDS = new Set(['lucky_charm', 'iron_ring', 'sage_amulet']);

export function ShopScreen() {
  const { player, updatePlayer, setScreen, selectedShop, shopReturn } = useGameStore();
  const addLog = useUIStore((s) => s.addLog);
  const [mode, setMode] = useState<ShopMode>('buy');
  const shopType: ShopType = selectedShop;

  if (!player) return null;

  const stockIds = SHOP_STOCK[shopType] || [];
  const stock = stockIds.map((id) => ITEMS[id]).filter(Boolean);

  const sellableItems = player.inventory.filter(
    (s) => s.item.type !== 'key'
  );

  const backLabel = shopReturn === 'dungeon' ? '[Back to Dungeon]' : '[Back to Town]';

  const handleBuy = (item: Item) => {
    if (player.gold < item.price) {
      addLog('Not enough gold!', 'danger');
      return;
    }

    const idx = player.inventory.findIndex((s) => s.item.id === item.id);
    const newInv =
      idx >= 0
        ? player.inventory.map((s, i) => (i === idx ? { ...s, quantity: s.quantity + 1 } : s))
        : [...player.inventory, { item, quantity: 1 }];

    updatePlayer({ gold: player.gold - item.price, inventory: newInv });
    useGameStore.getState().save();
    addLog(`Bought ${item.name} for ${item.price} gold. (Autosaved)`, 'loot');
  };

  const handleSell = (itemId: string) => {
    const slot = player.inventory.find((s) => s.item.id === itemId);
    if (!slot) return;

    const sellPrice = Math.floor(slot.item.price * 0.5);
    const newInv = player.inventory
      .map((s) => (s.item.id === itemId ? { ...s, quantity: s.quantity - 1 } : s))
      .filter((s) => s.quantity > 0);

    // Unequip if the last copy was sold so equipment never references a missing item.
    const newEquipment = { ...player.equipment };
    if (slot.quantity <= 1) {
      if (newEquipment.weapon?.id === itemId) newEquipment.weapon = null;
      if (newEquipment.armor?.id === itemId) newEquipment.armor = null;
      if (newEquipment.accessory?.id === itemId) newEquipment.accessory = null;
    }

    const newGold = player.gold + sellPrice;
    updatePlayer({ gold: newGold, inventory: newInv, equipment: newEquipment });
    useGameStore.getState().updateQuestProgress('gold', 'any', newGold);
    useGameStore.getState().save();
    addLog(`Sold ${slot.item.name} for ${sellPrice} gold.`, 'loot');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-terminal-cyan text-lg tracking-widest uppercase">
          [{SHOP_ICONS[shopType]}] {SHOP_NAMES[shopType]}
        </h1>
        <Button variant="ghost" size="sm" onClick={() => setScreen(shopReturn)}>
          {backLabel}
        </Button>
      </div>

      {shopType === 'magic_shop' && (
        <div className="text-[11px] text-terminal-dim">
          Accessories equip to the Accessory slot via Inventory. {ACCESSORY_IDS.size} charms in stock.
        </div>
      )}

      <div className="flex items-center gap-4 text-xs">
        <span className="text-terminal-yellow">Gold: {player.gold}</span>
        <Button
          size="sm"
          variant={mode === 'buy' ? 'primary' : 'ghost'}
          onClick={() => setMode('buy')}
        >
          Buy
        </Button>
        <Button
          size="sm"
          variant={mode === 'sell' ? 'primary' : 'ghost'}
          onClick={() => setMode('sell')}
        >
          Sell
        </Button>
      </div>

      {mode === 'buy' && (
        <Panel title="Stock">
          {stock.length === 0 ? (
            <div className="text-terminal-dim text-xs italic">Nothing in stock.</div>
          ) : (
            <div className="space-y-2">
              {stock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-terminal-dim/30 pb-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ color: getRarityColor(item.rarity) }}>
                        {item.name}
                      </span>
                      <span className="text-terminal-dim text-[10px] uppercase">
                        [{item.rarity}]
                      </span>
                    </div>
                    <div className="text-terminal-dim text-[10px]">{item.description}</div>
                    {item.statBonus && (
                      <div className="text-terminal-green text-[10px]">
                        {Object.entries(item.statBonus).map(([stat, val]) => (
                          <span key={stat} className="mr-2">+{val} {stat.toUpperCase()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleBuy(item)}
                    disabled={player.gold < item.price}
                  >
                    {item.price}g
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {mode === 'sell' && (
        <Panel title="Your Items">
          {sellableItems.length === 0 ? (
            <div className="text-terminal-dim text-xs italic">Nothing to sell.</div>
          ) : (
            <div className="space-y-2">
              {sellableItems.map((slot) => {
                const sellPrice = Math.floor(slot.item.price * 0.5);
                return (
                  <div
                    key={slot.item.id}
                    className="flex items-center justify-between border-b border-terminal-dim/30 pb-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: getRarityColor(slot.item.rarity) }}>
                          {slot.item.name}
                        </span>
                        {slot.quantity > 1 && (
                          <span className="text-terminal-yellow text-xs">x{slot.quantity}</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleSell(slot.item.id)}>
                      Sell {sellPrice}g
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

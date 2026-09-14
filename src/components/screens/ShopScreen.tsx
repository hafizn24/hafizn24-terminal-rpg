import { useMemo, useState } from 'react';
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

/** Sell price is 50% of buy price (floor). */
export function getSellPrice(item: Item): number {
  return Math.floor(item.price * 0.5);
}

/** Rare/epic gear or anything worth >=150g needs an explicit confirm. */
export function isValuableItem(item: Item): boolean {
  return item.rarity === 'rare' || item.rarity === 'epic' || getSellPrice(item) >= 150;
}

export function ShopScreen() {
  const { player, updatePlayer, setScreen, selectedShop, shopReturn } = useGameStore();
  const addLog = useUIStore((s) => s.addLog);
  const [mode, setMode] = useState<ShopMode>('buy');
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);
  const [pendingBulk, setPendingBulk] = useState(false);
  const shopType: ShopType = selectedShop;

  const stockIds = SHOP_STOCK[shopType] || [];
  const stock = stockIds.map((id) => ITEMS[id]).filter(Boolean);

  const sellableItems = useMemo(
    () => player?.inventory.filter((s) => s.item.type !== 'key') ?? [],
    [player]
  );

  // Junk = unequipped misc loot, safe to bulk-sell in one click.
  const junkSlots = useMemo(() => {
    if (!player) return [];
    return sellableItems.filter(
      (s) =>
        s.item.type === 'misc' &&
        player.equipment.weapon?.id !== s.item.id &&
        player.equipment.armor?.id !== s.item.id &&
        player.equipment.accessory?.id !== s.item.id
    );
  }, [sellableItems, player]);
  const junkTotal = junkSlots.reduce((sum, s) => sum + getSellPrice(s.item) * s.quantity, 0);
  const junkCount = junkSlots.reduce((sum, s) => sum + s.quantity, 0);

  if (!player) return null;

  const backLabel = shopReturn === 'dungeon' ? '[Back to Dungeon]' : '[Back to Town]';

  const getEquippedSlot = (itemId: string): string | null => {
    if (player.equipment.weapon?.id === itemId) return 'Weapon';
    if (player.equipment.armor?.id === itemId) return 'Armor';
    if (player.equipment.accessory?.id === itemId) return 'Accessory';
    return null;
  };

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

  const executeSell = (itemId: string, quantity: number) => {
    const p = useGameStore.getState().player;
    if (!p) return;
    const slot = p.inventory.find((s) => s.item.id === itemId);
    if (!slot) return;

    // Guard: never sell equipped gear — unequip first.
    const equipped = getEquippedSlot(itemId);
    if (equipped) {
      addLog(`Cannot sell ${slot.item.name} — it is equipped (${equipped}). Unequip it first.`, 'danger');
      return;
    }

    const qty = Math.min(quantity, slot.quantity);
    const gain = getSellPrice(slot.item) * qty;
    const newInv = p.inventory
      .map((s) => (s.item.id === itemId ? { ...s, quantity: s.quantity - qty } : s))
      .filter((s) => s.quantity > 0);

    const newGold = p.gold + gain;
    useGameStore.getState().updatePlayer({ gold: newGold, inventory: newInv });
    useGameStore.getState().updateQuestProgress('gold', 'any', newGold);
    useGameStore.getState().save();
    addLog(`Sold ${qty}x ${slot.item.name} for ${gain} gold.`, 'loot');
  };

  const handleSellClick = (itemId: string) => {
    const slot = player.inventory.find((s) => s.item.id === itemId);
    if (!slot) return;
    if (getEquippedSlot(itemId)) {
      addLog(`Cannot sell ${slot.item.name} — it is equipped. Unequip it first.`, 'danger');
      return;
    }
    if (isValuableItem(slot.item) && pendingConfirm !== itemId) {
      setPendingConfirm(itemId);
      return;
    }
    setPendingConfirm(null);
    executeSell(itemId, 1);
  };

  const handleSellAllClick = (itemId: string) => {
    const slot = player.inventory.find((s) => s.item.id === itemId);
    if (!slot || slot.quantity <= 1) return;
    if (getEquippedSlot(itemId)) {
      addLog(`Cannot sell ${slot.item.name} — it is equipped. Unequip it first.`, 'danger');
      return;
    }
    if (isValuableItem(slot.item) && pendingConfirm !== `${itemId}:all`) {
      setPendingConfirm(`${itemId}:all`);
      return;
    }
    setPendingConfirm(null);
    executeSell(itemId, slot.quantity);
  };

  const handleBulkSellJunk = () => {
    if (junkSlots.length === 0) return;
    const valuableInside = junkSlots.some((s) => isValuableItem(s.item));
    if ((valuableInside || junkTotal >= 150) && !pendingBulk) {
      setPendingBulk(true);
      return;
    }
    setPendingBulk(false);
    setPendingConfirm(null);
    const p = useGameStore.getState().player;
    if (!p) return;
    const junkIds = new Set(junkSlots.map((s) => s.item.id));
    const newInv = p.inventory.filter((s) => !junkIds.has(s.item.id));
    const newGold = p.gold + junkTotal;
    useGameStore.getState().updatePlayer({ gold: newGold, inventory: newInv });
    useGameStore.getState().updateQuestProgress('gold', 'any', newGold);
    useGameStore.getState().save();
    addLog(`Bulk-sold ${junkCount}x loot for ${junkTotal} gold.`, 'loot');
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

      <div className="flex items-center gap-4 text-xs flex-wrap">
        <span className="text-terminal-yellow">Gold: {player.gold}</span>
        <Button
          size="sm"
          variant={mode === 'buy' ? 'primary' : 'ghost'}
          onClick={() => {
            setMode('buy');
            setPendingConfirm(null);
            setPendingBulk(false);
          }}
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
        <span className="text-terminal-dim text-[10px]">
          Sell price = 50% of buy price. Equipped gear cannot be sold.
        </span>
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
          {junkSlots.length > 0 && (
            <div className="flex items-center justify-between border border-terminal-dim/40 px-2 py-1.5 mb-2 text-xs">
              <span className="text-terminal-dim">
                Loot: {junkCount}x worth <span className="text-terminal-yellow">{junkTotal}g</span>
              </span>
              {pendingBulk ? (
                <span className="flex gap-1">
                  <Button size="sm" variant="danger" onClick={handleBulkSellJunk}>
                    Confirm {junkTotal}g?
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingBulk(false)}>
                    Cancel
                  </Button>
                </span>
              ) : (
                <Button size="sm" onClick={handleBulkSellJunk}>
                  Sell all loot
                </Button>
              )}
            </div>
          )}
          {sellableItems.length === 0 ? (
            <div className="text-terminal-dim text-xs italic">Nothing to sell.</div>
          ) : (
            <div className="space-y-2">
              {sellableItems.map((slot) => {
                const sellPrice = getSellPrice(slot.item);
                const equippedSlot = getEquippedSlot(slot.item.id);
                const isEquipped = equippedSlot !== null;
                const valuable = isValuableItem(slot.item);
                const needsConfirm = pendingConfirm === slot.item.id;
                const needsConfirmAll = pendingConfirm === `${slot.item.id}:all`;
                return (
                  <div
                    key={slot.item.id}
                    className={`flex items-center justify-between border-b pb-2 ${
                      isEquipped
                        ? 'border-terminal-yellow/40 bg-terminal-yellow/5 px-1 opacity-80'
                        : 'border-terminal-dim/30'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ color: getRarityColor(slot.item.rarity) }}>
                          {isEquipped && <span className="mr-1">[E]</span>}
                          {slot.item.name}
                        </span>
                        {slot.quantity > 1 && (
                          <span className="text-terminal-yellow text-xs">x{slot.quantity}</span>
                        )}
                        <span className="text-terminal-dim text-[10px] uppercase">
                          [{slot.item.rarity}]
                        </span>
                        {isEquipped ? (
                          <span
                            className="text-terminal-yellow text-[10px] border border-terminal-yellow/60 px-1"
                            title={`Equipped in ${equippedSlot} slot — unequip before selling`}
                          >
                            EQUIPPED · {equippedSlot}
                          </span>
                        ) : (slot.item.type === 'weapon' || slot.item.type === 'armor') ? (
                          <span className="text-terminal-dim text-[10px] border border-terminal-dim/40 px-1">
                            unequipped
                          </span>
                        ) : null}
                        {valuable && !isEquipped && (
                          <span className="text-terminal-red text-[10px] border border-terminal-red/50 px-1">
                            valuable · confirm
                          </span>
                        )}
                      </div>
                      <div className="text-terminal-dim text-[10px]">
                        Sells for {sellPrice}g each
                        {slot.quantity > 1 && ` (${sellPrice * slot.quantity}g all)`}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 items-center">
                      {slot.quantity > 1 && !isEquipped && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSellAllClick(slot.item.id)}
                          title={`Sell all ${slot.quantity} for ${sellPrice * slot.quantity}g`}
                        >
                          {needsConfirmAll ? `Confirm ${sellPrice * slot.quantity}g?` : 'All'}
                        </Button>
                      )}
                      {needsConfirmAll && (
                        <Button size="sm" variant="ghost" onClick={() => setPendingConfirm(null)}>
                          X
                        </Button>
                      )}
                      {needsConfirm ? (
                        <span className="flex gap-1">
                          <Button size="sm" variant="danger" onClick={() => handleSellClick(slot.item.id)}>
                            Confirm {sellPrice}g?
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setPendingConfirm(null)}>
                            X
                          </Button>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant={isEquipped ? 'ghost' : undefined}
                          onClick={() => handleSellClick(slot.item.id)}
                          disabled={isEquipped}
                          title={
                            isEquipped
                              ? `Equipped in ${equippedSlot} slot — unequip in Inventory first`
                              : valuable
                                ? 'Valuable item — click twice to confirm'
                                : `Sell 1 for ${sellPrice}g`
                          }
                        >
                          {isEquipped ? 'Equipped' : `Sell ${sellPrice}g`}
                        </Button>
                      )}
                    </div>
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

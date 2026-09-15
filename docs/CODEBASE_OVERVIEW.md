# CODEBASE_OVERVIEW.md — Read this first (AI agent context)

> Token-efficient map of this repo. Check this file before reading source files.
> Project: `hafizn24-terminal-rpg` v0.1.0 — terminal-themed browser roguelite RPG.
> Flow: Title → ClassSelect → Town hub → 5x5 procedural Dungeon → turn-based Combat → descend/boss, checkpoint saves to localStorage.
> UI rule: minimal + single-purpose screens. No character art (text-only). Logs are single-line (latest only, fixed height, never expand).

## 1. Snapshot
- Stack: React 18.3.1 + Zustand 4.5.5 + Vite 5.4.2 + Tailwind 3.4.10 + TS 5.5.4. Font: JetBrains Mono.
- Entry: `index.html` (#root) → `src/main.tsx` → `src/App.tsx` (`TerminalWindow > ScreenRouter + StatusBar`) → `src/components/screens/ScreenRouter.tsx` (maps `currentScreen` → screen).
- Screens (`src/types/game.ts: Screen`): `title | classSelect | town | dungeon | combat | inventory | stats | gameOver | shop | questBoard`.
- Scripts: `npm run dev` (localhost:3000/5173), `npm run typecheck` (`tsc --noEmit`), `npm run build` (`tsc -b && vite build` → `dist/`), `npm run preview`. No unit tests; manual checklist in `TESTING.md`.

## 2. Directory map (33 files in `src/`)
```
src/App.tsx, main.tsx, index.css
src/types/game.ts                    # all shared types
src/utils/rng.ts, storage.ts         # dice/math, localStorage save
src/hooks/useKeyboard.ts             # key listener, skips INPUT/TEXTAREA
src/game/data/classes.ts, enemies.ts, items.ts, ascii.ts
src/game/store/gameStore.ts, uiStore.ts
src/game/systems/dungeonGenerator.ts, questSystem.ts
src/components/screens/ScreenRouter.tsx, TitleScreen.tsx, ClassSelectScreen.tsx, TownScreen.tsx, DungeonScreen.tsx, CombatScreen.tsx, ShopScreen.tsx, InventoryScreen.tsx, StatsScreen.tsx, QuestBoardScreen.tsx, GameOverScreen.tsx
src/components/terminal/TerminalWindow.tsx, StatusBar.tsx, LogPanel.tsx
src/components/ui/Button.tsx, Panel.tsx, ProgressBar.tsx, StatAllocationPanel.tsx
```

## 3. Core models (`src/types/game.ts`)
- `Player { name, class: warrior|mage|rogue|cleric, level, exp/expToNext, stats: Stats, gold, inventory: InventorySlot[], equipment: {weapon,armor,accessory}, floor, statPoints }` (unspent level-up points for STR/DEX/INT/HP/MP)
- `Stats { str,dex,int,hp,maxHp,mp,maxMp }`, `Item { id,name,type: weapon|armor|potion|key|misc, rarity, price, statBonus?, healAmount?, mpRestoreAmount?, effect?: bomb|smoke, effectPower? }`
- `Enemy { attack,defense,expReward,goldReward,lootTable: LootEntry[], skills: EnemySkill[] (burn|poison), isElite? }`
- `Room { type: empty|monster|treasure|trap|shop|stairs|boss|elite|shrine|start, explored, x,y, enemy?, item?, trapDamage?, shopItems? }`, `DungeonState { floor, rooms: Room[][], playerPos, gridSize:5 }`
- `Quest { type: daily|side, objective: {type: kill|floor|gold|collect, target, required}, progress, reward: {gold,exp,itemId?}, completed }`
- `GameStats { bestFloor, bossesKilled, runsStarted }`, `LogMessage { type: info|combat|loot|danger|system }`

## 4. State stores
- `src/game/store/gameStore.ts` (`create<GameStore>`, `ShopType=blacksmith|potion_shop|magic_shop`, `ShopReturn=town|dungeon`, `StatsReturn=town|inventory|dungeon`):
  State: `currentScreen='title', player, dungeon, quests, gameOverMessage, hasSave, selectedShop, shopReturn, statsReturn, lastSave, stats`.
  Checkpoint saves (`CHECKPOINT_INTERVAL=5` + `isBossFloor()` live in `dungeonGenerator.ts`, re-exported from the store as `isCheckpointFloor`; `getLastCheckpoint()` in `gameStore.ts`): `save()` always persists player/quests, but persists `dungeon` only on boss floors (5/10/15/...). Leaving a run before the next checkpoint discards the map.
  Actions: `setScreen, setSelectedShop(shop,ret?), setStatsReturn(ret), createPlayer(name,classId)` (gold 50 + 3x `hp_potion_s`, `statPoints: 0`, save immediately), `updatePlayer, setDungeon, setQuests, setGameOver, save(), load()` (→ dungeon or town; backfills `statPoints` for old saves: `(level-1)*3`), `newGame()` (clear → classSelect), `checkSave(), updateQuestProgress(event,target)` (floor/gold=max, else increment), `addItem(id,qty)`, `gainExp()` (loop `calcExpForLevel`, apply `CLASSES.growth`, full heal, +`STAT_POINTS_PER_LEVEL`=3 pts/level), `allocateStatPoint(stat)` (STR/DEX/INT +1, HP +10 max, MP +5 max; returns bool).
- `src/game/store/uiStore.ts`: `logMessages (last 50), nextLogId, addLog(text,type), clearLogs()`.

## 5. Data + systems
- `game/data/classes.ts`: warrior (14/10/6, 120/30, Power Strike 10MP 2.5x), mage (6/8/16, 80/80, Fireball 15MP 3x), rogue (10/16/8, 90/40, Backstab 12MP 3x+crit), cleric (10/8/12, 100/60, Holy Light 12MP 2x+heal).
- `game/data/enemies.ts`: `ENEMIES[10]` (slime→demon_knight), `BOSS_ENEMIES[4]` (goblin_king, necromancer, dragon_lord, demon_king). Each entry keeps an `ascii` string, but it is data-only — never rendered (text-only UI).
- `game/data/ascii.ts`: live helpers `isBossEnemy()`, `getFloorTheme()` (boss=red, f7+=yellow, f4+=green, else cyan). `ELITE_CROWN_ART` / `BOSS_AURA_TOP/BOTTOM` are retired, data-only, unused by render.
- `game/data/items.ts`: ~26 items in `ITEMS`, `SHOP_STOCK { blacksmith[9], potion_shop[6], magic_shop[7] }`. Sell = 0.5x floor.
- `game/systems/dungeonGenerator.ts`: `GRID_SIZE=5`, `CHECKPOINT_INTERVAL=5`, `isBossFloor(floor)` (5/10/15/...), `SHOP_SPAWN_CHANCE=0.3`, `SHOP_PITY_FLOORS=3`. `generateDungeon(floor)`: (0,0)=start, (4,4)=stairs, boss floor (`isBossFloor`) (4,3)=boss; rest weighted monster/treasure/trap/empty, 12% elite if floor≥2, 1x shrine, 0-1x shop (pity). Stairs are boss-gated (see `DungeonScreen.handleDescend`: descend blocked while a `boss` room still has an enemy). Fleeing before a checkpoint discards the map (`setDungeon(null)`); fleeing on a checkpoint keeps it for resume. Helpers: `scaleEnemy (*1+(floor-1)*0.15, elite HP1.5/ATK1.3/reward2x)`, `getRandomLoot` (uncommon f2+, rare f4+, epic f7+), `trapDamage=5-15+floor*2`, `getAdjacentRooms()`.
- `game/systems/questSystem.ts`: `QUEST_TEMPLATES[12]`, `generateDailyQuests(date)`→3, `generateSideQuests()`→2, `checkQuestProgress/isQuestComplete/checkDailyReset()`.
- `utils/rng.ts`: `randomInt, chance, pickRandom, shuffleArray, calcDamage(atk,def)=max(1,atk-def*0.5)*0.85-1.15, calcCritChance(dex)=min(0.4,0.05+dex*0.01), calcDodgeChance(pDex,eDex,guard)=min(0.3,max(0,0.05+(pDex-eDex)*0.01+(guard?0.15:0))), calcExpForLevel(l)=50*l^1.5, getRarityColor()`.
- `utils/storage.ts` (`terminal_rpg_save`): `saveGame/loadGame/hasSaveData/deleteSave()`, `DEFAULT_STATS {1,0,0}`, validates `player.name`, backfills `statPoints` for pre-points saves.

## 6. Screens (what edits where)
- `ScreenRouter.tsx`: `screenMap` 10 entries. Add new screen here + `Screen` union + store `setScreen`.
- `TitleScreen`: ASCII art, `checkSave()` on mount, New (confirm if save) → `newGame()`, Continue → `load()`, shows bestFloor/bosses.
- `ClassSelectScreen`: cards + name input (max16, Enter) → `createPlayer`.
- `TownScreen` (minimal, vertically centered): `Enter Dungeon` primary full-width, 2x2 `Inn/Stats/Quests/Inventory` (plain labels, `Stats (N)` badge when points available), `Shops — resupply here` panel with Blacksmith/Potion Shop/Magic Shop + one-line hints. No embedded stats, one-line `Floor · Best · Bosses · checkpoint · saved` status.
- `StatsScreen`: dedicated stats tab. Only place `StatAllocationPanel` appears full-page. `statsReturn` controls Back target (town/inventory/dungeon).
- `DungeonScreen` (minimal): header `FLOOR label + [Flee]`, map panel (no legend/tips/counter), compact D-pad (`^<v>`), Descend button only on stairs, single-line `LogPanel`. Boss floors tint red via `getFloorTheme()`.
- `CombatScreen` (minimal, text-only, no art): mirrored panels — enemy (`HP` bar + intent line) and `You` (`HP` + `MP` bars + skill/status line), same `Panel` format. Actions grid ABOVE the single-line latest-only log (fixed `h-7`, truncate, never expands). `ProgressBar` renders filled `█` in bright color + empty `░` in dim (never bright-on-bright) with `whitespace-nowrap` so bars can't wrap/bleed against scanlines.
- `ShopScreen`: header `[S] Blacksmith` / `[P] Potion Shop` / `[M] Magic Shop`, Buy/Sell tabs, back to `shopReturn` (`[Back to Dungeon]` / `[Back to Town]`). Sell: `getSellPrice`=0.5x floor, equipped items blocked (must unequip; `[E]`/EQUIPPED badge + disabled button), `isValuableItem` (rare/epic or ≥150g sell) needs two-step inline confirm, per-stack Sell All + bulk-sell `misc` loot with total + confirm. `InventoryScreen`: tabs all/gear/potions/misc/stats — `stats` tab renders `StatAllocationPanel` (dedicated tab), other tabs show one-line equipment summary + minimal item rows (name + qty + Use/Equip/Drop). `QuestBoardScreen`: header `Guild Board`, Active/Available tabs, text-only progress (`Progress: n/m`, no block bar), daily reset key `terminal_rpg_daily_reset`, accept/claim (gold+exp+item, remove, save). `GameOverScreen`: box-art banner + summary panel + `Load Last Save` (if save) / `New Game` / `Title Screen`.

## 7. UI/terminal primitives
- `TerminalWindow({title,children})`: title-bar dots + scanlines overlay. `StatusBar`: compact two-row footer (name/LV/class + gold/floor/XP, then 10-char HP/MP bars, truncate only, never scrolls). `LogPanel`: minimal single-line latest-only (`h-7`, truncate, `[x]` clear, no filters/expand/scroll). `StatAllocationPanel`: STR/DEX/INT/HP/MP rows with [+] when `statPoints>0`, ATK/DEF/CRIT preview (used only in StatsScreen + Inventory stats tab). `Button({variant: primary|danger|ghost, size: sm|md|lg, glow})`, `Panel({title, titleAlign})`, `ProgressBar({current,max,color,length=20})` (filled `█` bright + empty `░` dim).
- Styling: Tailwind `terminal-*` (`bg #0a0a0a, green #00ff41, cyan, red, yellow`), `font-mono`, `terminal-glow/border/btn`, `animate-fade-in/shake/...`, `prefers-reduced-motion` off. Tap ≥44px.
- `hooks/useKeyboard(keyMap)`: keydown, lowercase, preventDefault, skips inputs.

## 8. Persistence + conventions for AI agents
- Keys: `terminal_rpg_save`, `terminal_rpg_daily_reset`, (`terminal_rpg_quests` legacy). Checkpoint autosaves: createPlayer, inn rest, shop buy/sell, stat allocate, victory, descend, quest claim — but `dungeon` is only written on 5/10/15/... (see `gameStore.save`). Debug: `JSON.parse(localStorage.getItem('terminal_rpg_save'))`; reset: remove save+quests+reset then reload.
- Game loop: `title --New--> classSelect --create--> town <--> dungeon <--> combat --victory--> dungeon --E--> floor+1 (boss-gated on 5/10/15) --flee--> town (map kept only on checkpoints)`; `town<-->shop|inventory|stats|questBoard`; `inventory stats-tab <--> StatAllocationPanel`; death→gameOver→load/new/title.
- AI rules: single source of truth = `types/game.ts` + `gameStore`; combat math only in `rng.ts` + `CombatScreen`; dungeon layout only in `dungeonGenerator.ts`; quests only via `updateQuestProgress('kill'|'floor'|'gold')`; theme via `tailwind.config.js` + `terminal-*` classes, never hardcode hex; run `npm run typecheck` before PR; keep rooms one-shot (clear to `empty` after loot/trap/shrine). No character/enemy art in UI — `enemies.ts ascii` and `ascii.ts` overlays are data-only (the old `CLASS_ASCII` block was deleted outright); do not re-add `<pre>` art to CombatScreen. Only text banners remain: `TitleScreen` logo and `GameOverScreen` box.
- Common tasks: new item → `items.ts` + `SHOP_STOCK` if sellable; new enemy → `enemies.ts` (tune `getEnemiesForFloor`); new screen → `types/game.ts` + `ScreenRouter` + `App.tsx` StatusBar rule; new quest → `QUEST_TEMPLATES`.

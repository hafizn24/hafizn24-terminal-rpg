# CODEBASE_OVERVIEW.md — Read this first (AI agent context)

> Token-efficient map of this repo. Check this file before reading source files.
> Project: `hafizn24-terminal-rpg` v0.1.0 — terminal-themed browser roguelite RPG.
> Flow: Title → ClassSelect → Town hub → 5x5 procedural Dungeon → turn-based Combat → descend/boss, persist to localStorage.

## 1. Snapshot
- Stack: React 18.3.1 + Zustand 4.5.5 + Vite 5.4.2 + Tailwind 3.4.10 + TS 5.5.4. Font: JetBrains Mono.
- Entry: `index.html` (#root) → `src/main.tsx` → `src/App.tsx` (`TerminalWindow > ScreenRouter + StatusBar`) → `src/components/screens/ScreenRouter.tsx` (maps `currentScreen` → screen).
- Screens (`src/types/game.ts: Screen`): `title | classSelect | town | dungeon | combat | inventory | gameOver | shop | questBoard`.
- Scripts: `npm run dev` (localhost:3000/5173), `npm run typecheck` (`tsc --noEmit`), `npm run build` (`tsc -b && vite build` → `dist/`), `npm run preview`. No unit tests; manual checklist in `TESTING.md`.

## 2. Directory map (30 files in `src/`)
```
src/App.tsx, main.tsx, index.css
src/types/game.ts                    # all shared types
src/utils/rng.ts, storage.ts         # dice/math, localStorage save
src/hooks/useKeyboard.ts             # key listener, skips INPUT/TEXTAREA
src/game/data/classes.ts, enemies.ts, items.ts
src/game/store/gameStore.ts, uiStore.ts
src/game/systems/dungeonGenerator.ts, questSystem.ts
src/components/screens/ScreenRouter.tsx, TitleScreen.tsx, ClassSelectScreen.tsx, TownScreen.tsx, DungeonScreen.tsx, CombatScreen.tsx, ShopScreen.tsx, InventoryScreen.tsx, QuestBoardScreen.tsx, GameOverScreen.tsx
src/components/terminal/TerminalWindow.tsx, StatusBar.tsx, LogPanel.tsx
src/components/ui/Button.tsx, Panel.tsx, ProgressBar.tsx
```

## 3. Core models (`src/types/game.ts`)
- `Player { name, class: warrior|mage|rogue|cleric, level, exp/expToNext, stats: Stats, gold, inventory: InventorySlot[], equipment: {weapon,armor,accessory}, floor }`
- `Stats { str,dex,int,hp,maxHp,mp,maxMp }`, `Item { id,name,type: weapon|armor|potion|key|misc, rarity, price, statBonus?, healAmount?, mpRestoreAmount?, effect?: bomb|smoke, effectPower? }`
- `Enemy { attack,defense,expReward,goldReward,lootTable: LootEntry[], skills: EnemySkill[] (burn|poison), isElite? }`
- `Room { type: empty|monster|treasure|trap|shop|stairs|boss|elite|shrine|start, explored, x,y, enemy?, item?, trapDamage?, shopItems? }`, `DungeonState { floor, rooms: Room[][], playerPos, gridSize:5 }`
- `Quest { type: daily|side, objective: {type: kill|floor|gold|collect, target, required}, progress, reward: {gold,exp,itemId?}, completed }`
- `GameStats { bestFloor, bossesKilled, runsStarted }`, `LogMessage { type: info|combat|loot|danger|system }`

## 4. State stores
- `src/game/store/gameStore.ts` (`create<GameStore>`, `ShopType=blacksmith|potion_shop|magic_shop`, `ShopReturn=town|dungeon`):
  State: `currentScreen='title', player, dungeon, quests, gameOverMessage, hasSave, selectedShop, shopReturn, lastSave, stats`.
  Actions: `setScreen, setSelectedShop(shop,ret?), createPlayer(name,classId)` (gold 50 + 3x `hp_potion_s`, save immediately), `updatePlayer, setDungeon, setQuests, setGameOver, save(), load()` (→ dungeon or town), `newGame()` (clear → classSelect), `checkSave(), updateQuestProgress(event,target)` (floor/gold=max, else increment), `addItem(id,qty)`, `gainExp()` (loop `calcExpForLevel`, apply `CLASSES.growth`, full heal).
- `src/game/store/uiStore.ts`: `logMessages (last 50), nextLogId, addLog(text,type), clearLogs()`.

## 5. Data + systems
- `game/data/classes.ts`: warrior (14/10/6, 120/30, Power Strike 10MP 2.5x), mage (6/8/16, 80/80, Fireball 15MP 3x), rogue (10/16/8, 90/40, Backstab 12MP 3x+crit), cleric (10/8/12, 100/60, Holy Light 12MP 2x+heal).
- `game/data/enemies.ts`: `ENEMIES[10]` (slime→demon_knight), `BOSS_ENEMIES[4]` (goblin_king, necromancer, dragon_lord, demon_king).
- `game/data/items.ts`: ~26 items in `ITEMS`, `SHOP_STOCK { blacksmith[9], potion_shop[6], magic_shop[7] }`. Sell = 0.5x floor.
- `game/systems/dungeonGenerator.ts`: `GRID_SIZE=5`, `SHOP_SPAWN_CHANCE=0.3`, `SHOP_PITY_FLOORS=3`. `generateDungeon(floor)`: (0,0)=start, (4,4)=stairs, boss floor (`%5==0`) (4,3)=boss; rest weighted monster/treasure/trap/empty, 12% elite if floor≥2, 1x shrine, 0-1x shop (pity). Helpers: `scaleEnemy (*1+(floor-1)*0.15, elite HP1.5/ATK1.3/reward2x)`, `getRandomLoot` (uncommon f2+, rare f4+, epic f7+), `trapDamage=5-15+floor*2`, `getAdjacentRooms()`.
- `game/systems/questSystem.ts`: `QUEST_TEMPLATES[12]`, `generateDailyQuests(date)`→3, `generateSideQuests()`→2, `checkQuestProgress/isQuestComplete/checkDailyReset()`.
- `utils/rng.ts`: `randomInt, chance, pickRandom, shuffleArray, calcDamage(atk,def)=max(1,atk-def*0.5)*0.85-1.15, calcCritChance(dex)=min(0.4,0.05+dex*0.01), calcExpForLevel(l)=50*l^1.5, getRarityColor()`.
- `utils/storage.ts` (`terminal_rpg_save`): `saveGame/loadGame/hasSaveData/deleteSave()`, `DEFAULT_STATS {1,0,0}`, validates `player.name`.

## 6. Screens (what edits where)
- `ScreenRouter.tsx`: `screenMap` 9 entries. Add new screen here + `Screen` union + store `setScreen`.
- `TitleScreen`: ASCII art, `checkSave()` on mount, New (confirm if save) → `newGame()`, Continue → `load()`, shows bestFloor/bosses.
- `ClassSelectScreen`: cards + name input (max16, Enter) → `createPlayer`.
- `TownScreen`: hub `[BSM]/[POT]/[MAG]` → shop, `[INV]`, `[INN]` full heal+save, `[GLD]` quests, `[DGN]` enter/resume (reuse if `dungeon.floor==player.floor` else regen). Shows last-run panel.
- `DungeonScreen`: lazy `generateDungeon(player.floor)`, `handleMove/handleRoomEntry` (monster→combat, treasure→addItem, trap→dmg/gameOver, shrine→+30%, shop→shop screen, stairs→hint), `handleDescend` (floor+1, regen, quest+save), `handleFlee`→town. Grid `@/M/E/+/T/^/$/>/B/·`. Keys: WASD/arrows, E descend, Esc town.
- `CombatScreen`: local `CombatState`, `rollIntent`, atk=`str+weapon+acc`, def=`armor.hp/5`, crit+lucky_charm. Actions: Attack, Skill (`(str+int)*power/2`, rogue 25% 2x, cleric heal), Item (smoke=flee, bomb=`power+floor*3`, potions block if full), Guard (halve+5MP), Run (`0.4+dex*0.02`). Victory: loot rolls, elite bonus 35%, gold+`gainExp`, quest kill/gold, clear room, autosave. Keys: 1/Enter atk, 2 skill, 3 potion, 4/Esc run, 5/G guard.
- `ShopScreen`: `SHOP_STOCK[selectedShop]`, buy/sell tabs, back to `shopReturn`. `InventoryScreen`: tabs all/equipment/consumables/misc, equip (accessory via `ACCESSORY_IDS`), use (potions), drop (confirm). `QuestBoardScreen`: daily reset key `terminal_rpg_daily_reset`, Active/Available, accept/claim (gold+exp+item, remove, save). `GameOverScreen`: summary + Load/ New/Title.

## 7. UI/terminal primitives
- `TerminalWindow({title,children})`: title-bar dots + scanlines overlay. `StatusBar`: NAME LV CLASS HP/MP bars GOLD FLOOR EXP (hidden on title/classSelect/gameOver). `LogPanel`: filter all/combat/loot/system, [+]/[-]/[Clear], auto-scroll. `Button({variant: primary|danger|ghost, size: sm|md|lg, glow})`, `Panel({title})`, `ProgressBar({current,max,color})` (20-char █/░).
- Styling: Tailwind `terminal-*` (`bg #0a0a0a, green #00ff41, cyan, red, yellow`), `font-mono`, `terminal-glow/border/btn`, `animate-fade-in/shake/...`, `prefers-reduced-motion` off. Tap ≥44px.
- `hooks/useKeyboard(keyMap)`: keydown, lowercase, preventDefault, skips inputs.

## 8. Persistence + conventions for AI agents
- Keys: `terminal_rpg_save`, `terminal_rpg_daily_reset`, (`terminal_rpg_quests` legacy). Autosave on: createPlayer, inn rest, shop buy/sell, victory, descend, quest claim. Debug: `JSON.parse(localStorage.getItem('terminal_rpg_save'))`; reset: remove save+quests+reset then reload.
- Game loop: `title --New--> classSelect --create--> town <--> dungeon <--> combat --victory--> dungeon --E--> floor+1 --flee--> town`; `town<-->shop|inventory|questBoard`; death→gameOver→load/new/title.
- AI rules: single source of truth = `types/game.ts` + `gameStore`; combat math only in `rng.ts` + `CombatScreen`; dungeon layout only in `dungeonGenerator.ts`; quests only via `updateQuestProgress('kill'|'floor'|'gold')`; theme via `tailwind.config.js` + `terminal-*` classes, never hardcode hex; run `npm run typecheck` before PR; keep rooms one-shot (clear to `empty` after loot/trap/shrine).
- Common tasks: new item → `items.ts` + `SHOP_STOCK` if sellable; new enemy → `enemies.ts` (tune `getEnemiesForFloor`); new screen → `types/game.ts` + `ScreenRouter` + `App.tsx` StatusBar rule; new quest → `QUEST_TEMPLATES`.

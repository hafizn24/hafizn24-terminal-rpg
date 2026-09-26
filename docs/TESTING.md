# Terminal RPG - Testing Guide

## Quick Start

```bash
# Install dependencies (if not done)
npm install

# Start dev server
npm run dev

# Open in browser
# http://localhost:5173 (vite default)
```

## Automated Tests

```bash
# Type checking
npm run typecheck

# Lint (base JS + TS + react-hooks)
npm run lint

# Unit + balance suite (Vitest: engine rules, seeded gen, 1,000-run medians,
# save round-trips/migrations, telemetry opt-in)
npm test

# Full build check (also emits the PWA service worker)
npm run build
```

## Manual Test Checklist

### 1. localStorage Persistence (Bug Fix Verification)

- [ ] Open game, click "New Game"
- [ ] Select a class (5 available: Warrior/Mage/Rogue/Cleric/Ranger), enter a name, click "Begin Adventure"
- [ ] **Refresh the page** (F5 or Ctrl+R)
- [ ] **Expected:** Title screen shows "Continue" button (NOT "New Game" only)
- [ ] Click "Continue" — should load your saved character and go to Town
- [ ] Open DevTools > Application > Local Storage > check `terminal_rpg_save` exists (schema `SAVE_VERSION=3`, hash-checked)

### 2. Dungeon Entry

- [ ] From Town, click "Enter Dungeon"
- [ ] **Expected:** Game transitions to Dungeon screen, does NOT freeze
- [ ] You should see "FLOOR 1" and the 5x5 grid map (6x6 on floors 11-20, 7x7 on 21+)
- [ ] Tutorial overlay shows on first visit (dismiss persists `terminal_rpg_tutorial_done`)
- [ ] Click "[Flee]" — returns to Town (map cached, re-enter resumes)
- [ ] Click "Enter Dungeon" again
- [ ] **Expected:** Same cached map resumes, no freeze on re-entry

### 3. Dungeon Navigation

- [ ] Click North/South/East/West buttons (^ < v >) or tap a glowing adjacent tile to move
- [ ] **Expected:** ◎ marker moves on the grid, rooms become explored
- [ ] Try WASD keys — should also move
- [ ] Try Arrow keys — should also move
- [ ] Try pressing Escape — should return to Town

### 4. Combat System (minimal, text-only)

- [ ] Move to a monster tile (◆) — combat should start
- [ ] **Expected:** Mirrored text panels — enemy (HP bar + intent line) and You (HP + MP bars + skill/status line), NO ASCII art
- [ ] Actions appear ABOVE a single-line log showing only the latest entry (fixed height, never expands)
- [ ] Click "[1] Attack" — deals damage, single-line log updates
- [ ] Click "[2] Skill" — uses class skill, costs MP
- [ ] Click "[3] Potion" — uses a potion if available (shows H/M counts)
- [ ] Click "[4] Run" — attempts to flee (may fail)
- [ ] Click "[5] Guard" — halves next hit, +dodge, +5 MP
- [ ] Win combat — should show "VICTORY!" and return to dungeon
- [ ] Lose combat — should show "GAME OVER" screen

### 5. Shop System

- [ ] From Town, click "Blacksmith" (Shops panel)
- [ ] **Expected:** Shop screen header (e.g. "[S] Blacksmith") with items and prices
- [ ] Click "Buy" on an item — gold decreases, item added to inventory
- [ ] Try buying with insufficient gold — should show "Not enough gold!"
- [ ] Click "Sell" tab — shows your sellable items
- [ ] Click "Sell" — gold increases, item removed
- [ ] Click "[Back to Town]" — returns to Town

### 6. Inventory + Stats System

- [ ] From Town, click "Stats" — dedicated Stats screen with STR/DEX/INT/HP/MP allocation (DEF is earned via growth/gear/Smithy, not bought)
- [ ] From Town, click "Inventory"
- [ ] **Expected:** Tabbed view (All/Gear/Potions), one-line equipment summary, Stats live on their own screen
- [ ] Click "Equip" on a weapon — equipment slot updates
- [ ] Click "Unequip" — returns to inventory
- [ ] Click "Use" on a potion — HP/MP restored
- [ ] Sell loot at town shops (no Drop action — sell instead)

### 6b. Checkpoint Saves + Boss Floors

- [ ] Reach floor 5/10/15 — boss room (▲) present, stairs blocked until boss dies ("Defeat it first")
- [ ] Flee to town on floor 2-4 — map discarded, save contains `dungeon: null`, re-enter starts fresh
- [ ] Flee to town on floor 5 — map kept, "Resume Dungeon" works after reload
- [ ] `JSON.parse(localStorage.getItem('terminal_rpg_save')).dungeon` is non-null only on 5/10/15/...

### 7. Feats (Achievements)

- [ ] From Town, click "Feats"
- [ ] **Expected:** 12 skill-based achievements (first blood, flawless boss, vault raider, etc.), locked shows `???`
- [ ] Kill 1 enemy — `first_blood` unlocks with toast + SFX
- [ ] (Guild Board quests removed — feats + Bestiary + daily leaderboard are the meta goals)

### 8. Inn Rest

- [ ] From Town, click "Inn"
- [ ] **Expected:** HP and MP fully restored, costs `15 × level` escalating per rest-without-descend
- [ ] Game saved to localStorage

### 8b. Smithy (Enchanting)

- [ ] From Town, click "Smithy"
- [ ] **Expected:** Weapon/armor list with enchant levels (+0..+5), cost `100 × 2^level`
- [ ] Enchant a weapon — ATK preview increases, gold decreases, `instanceData.enchantLevel` persists across reload
- [ ] Max +5 — button disables at cap

### 8c. Achievements

- [ ] From Town, click "Feats"
- [ ] **Expected:** 12 achievements (first blood, flawless boss, vault raider, etc.), locked shows `???`
- [ ] Kill 1 enemy — `first_blood` unlocks with toast + SFX

### 9. Game Over & New Game

- [ ] Die in combat or to a trap
- [ ] **Expected:** Game Over screen with stats
- [ ] Click "New Game" — starts fresh class selection
- [ ] Click "Title Screen" — returns to title

### 10. Mobile Responsiveness

- [ ] Open DevTools, toggle device toolbar (Ctrl+Shift+M)
- [ ] Select a mobile device (iPhone, Pixel, etc.)
- [ ] **Expected:** Layout adapts, buttons are tap-friendly
- [ ] Dungeon grid cells stay fixed-size and tappable; adjacent tiles glow
- [ ] Footer stays two rows with short HP/MP bars — no horizontal scrolling anywhere
- [ ] Combat log and dungeon log stay single-line, never push layout

### 11. Keyboard Shortcuts

- [ ] In Dungeon: WASD / Arrow keys move, E descends stairs, Esc returns to Town
- [ ] In Combat: 1=Attack, 2=Skill, 3=Potion, 4=Run, 5=Guard
- [ ] In Combat: Enter=Attack, G=Guard, Escape=Run
- [ ] In text inputs (e.g. name entry): shortcuts are ignored while typing

## Known Limitations

- No automated browser tests — Playwright smoke covers title → town → dungeon → combat victory on `dist/` preview (see `.github/workflows/ci.yml`); manual testing still required for feel
- WebAudio synth SFX implemented (`src/utils/audio.ts`, 13+ cues, mute persisted as `terminal_rpg_muted`); Google Fonts online-only with monospace fallback
- localStorage limit ~5MB (plenty for this game)

## Debugging Tips

```bash
# Check localStorage in browser console:
JSON.parse(localStorage.getItem('terminal_rpg_save'))

# Clear all game data:
localStorage.removeItem('terminal_rpg_save')

# Force fresh state:
location.reload()
```

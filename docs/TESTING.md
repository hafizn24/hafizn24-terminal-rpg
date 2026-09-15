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
# Type checking (no runtime tests, just compile check)
npm run typecheck

# Full build check
npm run build
```

## Manual Test Checklist

### 1. localStorage Persistence (Bug Fix Verification)

- [ ] Open game, click "New Game"
- [ ] Select a class, enter a name, click "Begin Adventure"
- [ ] **Refresh the page** (F5 or Ctrl+R)
- [ ] **Expected:** Title screen shows "Continue" button (NOT "New Game" only)
- [ ] Click "Continue" — should load your saved character and go to Town
- [ ] Open DevTools > Application > Local Storage > check `terminal_rpg_save` exists

### 2. Dungeon Entry

- [ ] From Town, click "Enter Dungeon"
- [ ] **Expected:** Game transitions to Dungeon screen, does NOT freeze
- [ ] You should see "FLOOR 1" and the 5x5 grid map
- [ ] Click "[Flee]" — returns to Town (map discarded before floor 5)
- [ ] Click "Enter Dungeon" again
- [ ] **Expected:** New dungeon generated, no freeze on re-entry

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

- [ ] From Town, click "Stats" — dedicated Stats screen with STR/DEX/INT/HP/MP allocation
- [ ] From Town, click "Inventory"
- [ ] **Expected:** Tabbed view (All/Gear/Potions/Misc/Stats), one-line equipment summary, NO embedded stats panel outside the Stats tab
- [ ] Click the "Stats" tab — shows the same allocation panel (dedicated tab)
- [ ] Click "Equip" on a weapon — equipment slot updates
- [ ] Click "Unequip" — returns to inventory
- [ ] Click "Use" on a potion — HP/MP restored
- [ ] Click "Drop" — item removed from inventory (confirm prompt)

### 6b. Checkpoint Saves + Boss Floors

- [ ] Reach floor 5/10/15 — boss room (▲) present, stairs blocked until boss dies ("Defeat it first")
- [ ] Flee to town on floor 2-4 — map discarded, save contains `dungeon: null`, re-enter starts fresh
- [ ] Flee to town on floor 5 — map kept, "Resume Dungeon" works after reload
- [ ] `JSON.parse(localStorage.getItem('terminal_rpg_save')).dungeon` is non-null only on 5/10/15/...

### 7. Quest System

- [ ] From Town, click "Quests"
- [ ] **Expected:** Guild Board with Active/Available tabs, text-only progress (no bars)
- [ ] Click "Accept" on a quest — moves to Active tab
- [ ] Go fight enemies — quest progress should update
- [ ] Complete quest objective — "Claim" button appears
- [ ] Click "Claim" — gold/EXP rewards added

### 8. Inn Rest

- [ ] From Town, click "Inn"
- [ ] **Expected:** HP and MP fully restored
- [ ] Game saved to localStorage

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

- No automated browser tests (manual testing required)
- No unit tests for game logic (add vitest if needed)
- Sound effects not implemented
- localStorage limit ~5MB (plenty for this game)

## Debugging Tips

```bash
# Check localStorage in browser console:
JSON.parse(localStorage.getItem('terminal_rpg_save'))

# Clear all game data:
localStorage.removeItem('terminal_rpg_save')
localStorage.removeItem('terminal_rpg_quests')
localStorage.removeItem('terminal_rpg_daily_reset')

# Force fresh state:
location.reload()
```

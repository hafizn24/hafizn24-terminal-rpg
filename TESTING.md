# Terminal RPG - Testing Guide

## Quick Start

```bash
# Install dependencies (if not done)
npm install

# Start dev server
npm run dev

# Open in browser
# http://localhost:3000
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

### 2. Dungeon Entry (Freeze Fix Verification)

- [ ] From Town, click "[DGN] Enter Dungeon"
- [ ] **Expected:** Game transitions to Dungeon screen, does NOT freeze
- [ ] You should see "FLOOR 1" and the 5x5 grid map
- [ ] Click "Flee to Town" — returns to Town
- [ ] Click "[DGN] Enter Dungeon" again
- [ ] **Expected:** New dungeon generated, no freeze on re-entry

### 3. Dungeon Navigation

- [ ] Click North/South/East/West buttons to move
- [ ] **Expected:** @ symbol moves on the grid, rooms become explored
- [ ] Try WASD keys — should also move
- [ ] Try Arrow keys — should also move
- [ ] Try pressing Escape — should return to Town

### 4. Combat System

- [ ] Move to a room with "M" (Monster) — combat should start
- [ ] **Expected:** Enemy ASCII art, HP bars, combat log
- [ ] Click "[1] Attack" — deals damage, shows in combat log
- [ ] Click "[2] Skill" — uses class skill, costs MP
- [ ] Click "[3] Item" — uses a potion if available
- [ ] Click "[4] Run" — attempts to flee (may fail)
- [ ] Win combat — should show "VICTORY!" and return to dungeon
- [ ] Lose combat — should show "GAME OVER" screen

### 5. Shop System

- [ ] From Town, click "[BSM] Blacksmith"
- [ ] **Expected:** Shop screen with items and prices
- [ ] Click "Buy" on an item — gold decreases, item added to inventory
- [ ] Try buying with insufficient gold — should show "Not enough gold!"
- [ ] Click "Sell" tab — shows your sellable items
- [ ] Click "Sell" — gold increases, item removed
- [ ] Click "[Back to Town]" — returns to Town

### 6. Inventory System

- [ ] From Town, click "[INV] Inventory"
- [ ] **Expected:** Tabbed view (All/Equipment/Potions/Misc)
- [ ] Click "Equip" on a weapon — equipment slot updates
- [ ] Click "Unequip" — returns to inventory
- [ ] Click "Use" on a potion — HP/MP restored
- [ ] Click "Drop" — item removed from inventory

### 7. Quest System

- [ ] From Town, click "[GLD] Guild Board"
- [ ] **Expected:** Shows available quests
- [ ] Click "Accept" on a quest — moves to Active tab
- [ ] Go fight enemies — quest progress should update
- [ ] Complete quest objective — "Claim" button appears
- [ ] Click "Claim" — gold/EXP rewards added

### 8. Inn Rest

- [ ] From Town, click "[INN] Rest & Save"
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
- [ ] **Expected:** Layout adapts, buttons are tap-friendly (44px min)
- [ ] Dungeon grid cells shrink on small screens
- [ ] MobileNav D-pad appears on mobile viewport

### 11. Keyboard Shortcuts

- [ ] In Dungeon: WASD / Arrow keys move
- [ ] In Combat: 1=Attack, 2=Skill, 3=Item, 4=Run
- [ ] In Combat: Enter=Attack, Escape=Run
- [ ] On Title: typing is blocked (input fields除外)

## Known Limitations

- No automated browser tests (manual testing required)
- No unit tests for game logic (add vitest if needed)
- Sound effects not implemented
- localStorage limit ~5MB (足够 for this game)

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

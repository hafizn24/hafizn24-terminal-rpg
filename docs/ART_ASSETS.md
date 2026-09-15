# ART_ASSETS.md — Character art inventory

> REMOVED FROM UI (minimalistic pass): no character art is rendered anywhere.
> Combat is text-only — enemy/player `<pre>` ASCII, elite crowns, and boss
> auras were deleted from `CombatScreen.tsx`. The strings below remain in
> data files as reference only (`enemies.ts ascii`, `ascii.ts` overlays,
> old `CLASS_ASCII`) and must NOT be re-added to the UI without a design
> decision. Palette + spec kept for future key-art only.

## Conventions

- UI is text-only: no character/enemy sprites are rendered. The `ascii`
  strings in `enemies.ts` and the overlays in `ascii.ts` are kept as
  reference data only (see §4).
- Monospace-safe glyphs only (`░▒▓█ ▄▀`, box drawing — no emoji/CJK so
  columns stay aligned in JetBrains Mono). This applies to bars, map
  tiles, and the two text banners in §5.
- Palette = terminal theme (`tailwind.config.js`): see spec table below.

## 1. Player classes (4)

Art: deleted from UI (the old `CLASS_ASCII` block in `CombatScreen.tsx` was
removed outright). Class tags (`[SWORD]` etc.) still live in
`src/game/data/classes.ts` and are still shown on the class-select cards.

| ID | Name | Role | Accent | Base stats | Skill | Status |
|----|------|------|--------|------------|-------|--------|
| `warrior` | Warrior | melee tank | red `#ff0040` | 14/10/6, 120HP/30MP | Power Strike 10MP 2.5x | Removed from UI |
| `mage` | Mage | burst caster | cyan `#00ffff` | 6/8/16, 80HP/80MP | Fireball 15MP 3x | Removed from UI |
| `rogue` | Rogue | crit striker | yellow `#ffd700` | 10/16/8, 90HP/40MP | Backstab 12MP 3x+crit | Removed from UI |
| `cleric` | Cleric | healer hybrid | green `#00ff41` | 10/8/12, 100HP/60MP | Holy Light 12MP 2x+heal | Removed from UI |

<details><summary>Current ASCII (click to expand)</summary>

**warrior**
```
   /│▓▓▓\\
   │░▓█▓░│
   │▓███▓│
  /│█\\░/█│\\
   │▓█░█▓│
  /│▓█░█▓│\\
```

**mage**
```
     /\\
   (░▓░)
   │\\/\\│
   │░█░│
  /│▓█▓│\\
   │▓█▓│
```

**rogue**
```
   /--\\
   │<█>│
   │░▓░│
  /│▓█▓│\\
   │▓█▓│
  /░▓█▓░\\
```

**cleric**
```
    (+)
   \\│█│/
   ▓│█│▓
   /│█│\\
   ▓│█│▓
```

</details>

## 2. Enemies (10)

Art: `enemies.ts` → `ENEMIES[i].ascii` (data-only, never rendered). Pool
unlocks with depth (`getEnemiesForFloor`: first 3 on floor 1, more as
`ceil(floor/2)+1` grows).

| ID | Name | ATK / DEF / HP | Skills | Status |
|----|------|---------------|--------|--------|
| `slime` | Green Slime | 5 / 1 / 20 | — | Removed from UI |
| `goblin` | Goblin | 10 / 3 / 35 | Scratch 1.2x | Removed from UI |
| `skeleton` | Skeleton | 14 / 5 / 45 | Bone Crush 1.5x | Removed from UI |
| `dark_mage` | Dark Mage | 8 / 4 / 40 | Shadow Bolt 2x, Drain Life +poison | Removed from UI |
| `orc` | Orc Warrior | 20 / 8 / 70 | Cleave 1.8x, War Cry | Removed from UI |
| `shadow_wolf` | Shadow Wolf | 18 / 6 / 55 | Fang Strike 1.6x, Howl | Removed from UI |
| `wraith` | Wraith | 12 / 3 / 60 | Life Drain +poison, Soul Rend 2.2x | Removed from UI |
| `flame_elemental` | Flame Elemental | 10 / 5 / 50 | Fireball +burn, Flame Wave 1.8x | Removed from UI |
| `dragon_wyrmling` | Dragon Wyrmling | 28 / 12 / 100 | Fire Breath 2.8x, Tail Whip 1.5x | Removed from UI |
| `demon_knight` | Demon Knight | 32 / 15 / 120 | Hellfire Slash 3x, Dark Shield | Removed from UI |

<details><summary>Current ASCII (click to expand)</summary>

**slime / goblin / skeleton / dark_mage / orc / shadow_wolf / wraith / flame_elemental / dragon_wyrmling / demon_knight** — see `ENEMIES` in `src/game/data/enemies.ts` (shaded variants since `bd9a26a`).

</details>

## 3. Bosses (4)

Art: `enemies.ts` → `BOSS_ENEMIES[i].ascii` (data-only, never rendered).
Boss floors: `floor 5` → goblin_king, `10` → necromancer, `15` → dragon_lord,
`20` → demon_king. Boss fights are marked by a red `Panel` frame + `BOSS`
title, not by art.

| ID | Name | Floor | ATK / DEF / HP | Signature skill | Status |
|----|------|-------|---------------|-----------------|--------|
| `goblin_king` | Goblin King | 5 | 22 / 10 / 120 | Royal Smash 2x | Removed from UI |
| `necromancer` | Necromancer | 10 | 12 / 6 / 100 | Death Ray 2.5x | Removed from UI |
| `dragon_lord` | Dragon Lord | 15 | 38 / 18 / 250 | Inferno Breath 3.5x | Removed from UI |
| `demon_king` | Demon King | 20 | 45 / 22 / 400 | Hellfire Storm 4x | Removed from UI |

## 4. Overlays (retired — data-only, unused by render)

| Asset | File | Former use | Status |
|-------|------|------------|--------|
| `ELITE_CROWN_ART` | `ascii.ts` | gold crown above elite sprites | Retired |
| `BOSS_AURA_TOP/BOTTOM` | `ascii.ts` | red aura bars around boss sprites | Retired |

## 5. Text banners (still rendered — not character art)

| Asset | Where | Notes |
|-------|-------|-------|
| Title logo | `TitleScreen` (`TITLE_ART`) | block-letter banner, still shown |
| Game-over box | `GameOverScreen` | box-drawing frame, still shown |
| Merchant | shop rooms (`DungeonScreen` → `ShopScreen`) | text log only (`"A mysterious merchant appears!"`) — no portrait |
| Shrine spirit | shrine rooms | text only |

## 6. Proper-art spec (for later commissioning)

- **Format:** transparent PNG or inline SVG, 1:1 portrait, min 256×256
  (combat cards render ~1 column wide; detail beats resolution).
- **Style:** dark terminal-fantasy, flat fills + rim light (matches the
  current shaded-ASCII read: silhouette first, glow second).
- **Palette (must use only these + black):**

| Token | Hex | Used for |
|-------|-----|----------|
| green | `#00ff41` | player accents, shop, loot glow |
| cyan | `#00ffff` | player HP/MP alt, shrine, stairs |
| red | `#ff0040` | enemies, danger, boss |
| yellow | `#ffd700` | elites, gold, crits |
| white | `#cccccc` | common rarity, body text |
| dim | `#008f11` | fog, disabled states |
| bg / panel | `#0a0a0a` / `#111111` | backgrounds |
| epic purple | `#bf00ff` | epic rarity only |

- **Per-character accent:** warrior red, mage cyan, rogue yellow, cleric green;
  slime/wraith green-cyan, skeleton/orc bone-white + red eyes,
  dark_mage/necromancer purple-cyan, flame/dragon/demon red-orange,
  wolf shadow-grey, goblin green.
- **Elite variant:** same portrait + gold crown overlay (no full redraw).
- **Boss variant:** same portrait + red aura frame (no full redraw).
- **Wiring (when ready):** add `portrait?: string` (asset path) to `Item`-style
  `Enemy`/`ClassDefinition` in `src/types/game.ts`, render `<img>` with the
  `<pre>` ASCII as fallback, keep `ascii.ts` overlays as CSS frames.

## 7. Checklist

- [ ] Player classes (4): warrior, mage, rogue, cleric
- [ ] Enemies (10): slime, goblin, skeleton, dark_mage, orc, shadow_wolf, wraith, flame_elemental, dragon_wyrmling, demon_knight
- [ ] Bosses (4): goblin_king, necromancer, dragon_lord, demon_king
- [ ] Merchant portrait
- [ ] Title key-art

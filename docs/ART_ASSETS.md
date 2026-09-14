# ART_ASSETS.md — Character art inventory

> Every character that currently has art, where the art lives, and the spec
> for replacing the ASCII placeholders with proper art later.
> Code truth: `src/game/data/enemies.ts` (`ascii`), `src/game/data/ascii.ts`
> (overlays), `src/components/screens/CombatScreen.tsx` (`CLASS_ASCII`).

## Conventions

- Current style: monospace ASCII with block/gradient shading (`░▒▓█ ▄▀`,
  box drawing only — no emoji/CJK so columns stay aligned in JetBrains Mono).
- Elite/boss tiers reuse base sprites + overlays (`ascii.ts`) — no redraws.
- Palette = terminal theme (`tailwind.config.js`): see spec table below.
- Status for all characters below: `ASCII placeholder` (proper art not started).

## 1. Player classes (4)

Art: `CombatScreen.tsx` → `CLASS_ASCII[warrior|mage|rogue|cleric]`.
Tags (`[SWORD]` etc.) in `src/game/data/classes.ts`.

| ID | Name | Role | Accent | Base stats | Skill | Status |
|----|------|------|--------|------------|-------|--------|
| `warrior` | Warrior | melee tank | red `#ff0040` | 14/10/6, 120HP/30MP | Power Strike 10MP 2.5x | ASCII placeholder |
| `mage` | Mage | burst caster | cyan `#00ffff` | 6/8/16, 80HP/80MP | Fireball 15MP 3x | ASCII placeholder |
| `rogue` | Rogue | crit striker | yellow `#ffd700` | 10/16/8, 90HP/40MP | Backstab 12MP 3x+crit | ASCII placeholder |
| `cleric` | Cleric | healer hybrid | green `#00ff41` | 10/8/12, 100HP/60MP | Holy Light 12MP 2x+heal | ASCII placeholder |

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

Art: `enemies.ts` → `ENEMIES[i].ascii`. Pool unlocks with depth
(`getEnemiesForFloor`: first 3 on floor 1, more as `ceil(floor/2)+1` grows).

| ID | Name | ATK / DEF / HP | Skills | Status |
|----|------|---------------|--------|--------|
| `slime` | Green Slime | 5 / 1 / 20 | — | ASCII placeholder |
| `goblin` | Goblin | 10 / 3 / 35 | Scratch 1.2x | ASCII placeholder |
| `skeleton` | Skeleton | 14 / 5 / 45 | Bone Crush 1.5x | ASCII placeholder |
| `dark_mage` | Dark Mage | 8 / 4 / 40 | Shadow Bolt 2x, Drain Life +poison | ASCII placeholder |
| `orc` | Orc Warrior | 20 / 8 / 70 | Cleave 1.8x, War Cry | ASCII placeholder |
| `shadow_wolf` | Shadow Wolf | 18 / 6 / 55 | Fang Strike 1.6x, Howl | ASCII placeholder |
| `wraith` | Wraith | 12 / 3 / 60 | Life Drain +poison, Soul Rend 2.2x | ASCII placeholder |
| `flame_elemental` | Flame Elemental | 10 / 5 / 50 | Fireball +burn, Flame Wave 1.8x | ASCII placeholder |
| `dragon_wyrmling` | Dragon Wyrmling | 28 / 12 / 100 | Fire Breath 2.8x, Tail Whip 1.5x | ASCII placeholder |
| `demon_knight` | Demon Knight | 32 / 15 / 120 | Hellfire Slash 3x, Dark Shield | ASCII placeholder |

<details><summary>Current ASCII (click to expand)</summary>

**slime / goblin / skeleton / dark_mage / orc / shadow_wolf / wraith / flame_elemental / dragon_wyrmling / demon_knight** — see `ENEMIES` in `src/game/data/enemies.ts` (shaded variants since `bd9a26a`).

</details>

## 3. Bosses (4)

Art: `enemies.ts` → `BOSS_ENEMIES[i].ascii`. One per boss floor
(`floor 5` → goblin_king, `10` → necromancer, `15` → dragon_lord, `20` → demon_king).
Rendered with `BOSS_AURA_TOP/BOTTOM` bars + red glow frame.

| ID | Name | Floor | ATK / DEF / HP | Signature skill | Status |
|----|------|-------|---------------|-----------------|--------|
| `goblin_king` | Goblin King | 5 | 22 / 10 / 120 | Royal Smash 2x | ASCII placeholder |
| `necromancer` | Necromancer | 10 | 12 / 6 / 100 | Death Ray 2.5x | ASCII placeholder |
| `dragon_lord` | Dragon Lord | 15 | 38 / 18 / 250 | Inferno Breath 3.5x | ASCII placeholder |
| `demon_king` | Demon King | 20 | 45 / 22 / 400 | Hellfire Storm 4x | ASCII placeholder |

## 4. Overlays (not characters — layered on sprites)

| Asset | File | Used for | Status |
|-------|------|----------|--------|
| `ELITE_CROWN_ART` | `ascii.ts` | elite rooms (gold crown above base sprite) | ASCII placeholder |
| `BOSS_AURA_TOP/BOTTOM` | `ascii.ts` | boss fights (red aura bars) | ASCII placeholder |

## 5. Missing art (characters with no sprite yet)

| Character | Where | Current | Needed later |
|-----------|-------|---------|--------------|
| Merchant | shop rooms (`DungeonScreen` → `ShopScreen`) | text log only (`"A mysterious merchant appears!"`) | shopkeeper portrait |
| Shrine spirit | shrine rooms | text only | optional ambient art |
| Title hero | `TitleScreen` | old ASCII banner | key-art / logo |

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

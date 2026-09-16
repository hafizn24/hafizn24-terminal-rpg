# hafizn24-terminal-rpg

> A terminal-themed browser roguelite RPG. **A paid-quality game, given free** — no pay-to-win, no energy timers, no ad gates. Ever.

Delve 30 floors through maze-like vaults, draft relics from bosses, slay the Demon King — then break the seal into endless descent.

## Play

- **Live build**: enable GitHub Pages (Settings → Pages → GitHub Actions) — deploys automatically from `main` via `.github/workflows/pages.yml`.
- **Local**: `npm install && npm run dev` (Vite serves on localhost).

Installable offline (PWA): the app shell is precached by the service worker after the first visit.

## Controls

| Where   | Keys                              |
| ------- | --------------------------------- |
| Dungeon | WASD / Arrows or tap · `E` descends stairs |
| Combat  | `1` attack · `2/Q/E` skills · `3` potion · `4` run · `5/G` guard |

Rest at the Inn to save (it costs gold — no free full heals). Shrines heal once. Elites drop bonus loot. Bosses gate the stairs every 5 floors.

## Highlights

- **4 classes × 3 skills** — unlock at Lv 1/4/8 with real roles (Rage, Weaken, Smoke Veil, Cleanse, wards), not bigger numbers.
- **30-floor authored spine** with 6 tiered bosses and an ending, then endless mode.
- **Relic drafts** after every boss, floor modifiers (Golden/Cursed/Swarm), locked vaults, growing maze grids, retiring enemy tiers with variants.
- **Meta-progression earned through play** — war shards buy Renown unlocks; daily seeded challenge with a local leaderboard; Bestiary collection; run summaries on death.
- **Deterministic engine** — seeded runs, 1,000-run balance suite (`npm test`), pure rules in `src/engine/`.

## Scripts

| Command           | What                              |
| ----------------- | --------------------------------- |
| `npm run dev`     | Dev server                        |
| `npm run typecheck` | `tsc --noEmit`                  |
| `npm run lint`    | ESLint (incl. react-hooks)        |
| `npm test`        | Vitest: unit + balance suite      |
| `npm run build`   | Typecheck + production build      |

CI (`.github/workflows/ci.yml`) runs all four on every push/PR.

## Tech

React 18 + Zustand + Vite 5 + Tailwind + TypeScript (strict). WebAudio synth SFX (no assets), `localStorage` saves with versioned migrations, opt-in local-only telemetry (off by default, JSON export in Renown).

Repo map for humans and agents: [`docs/CODEBASE_OVERVIEW.md`](docs/CODEBASE_OVERVIEW.md).

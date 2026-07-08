# QuizMon Overworld

An overworld-RPG base for QuizMon, built on the MIT-licensed
[Monster Tamer](https://github.com/devshareacademy/monster-tamer) tutorial
codebase (Phaser 3) with **mobile touch controls** added.

## Quick start
```bash
npm install          # installs deps + fetches dev-only placeholder assets
npm run dev          # start the dev server (also reachable from your phone on LAN)
```
Open the printed URL. Drag the on-screen joystick to move; A = confirm,
B = back, Y = interact. Keyboard (arrows / Enter / Shift / F) also works.

If asset fetching was skipped or blocked:
```bash
npm run fetch-assets
```

## What this is
- **`src/`** — the game (vendored Monster Tamer + our changes).
- **`src/utils/touch-input.js` + `controls.js`** — the touch layer; makes the
  whole game playable on a phone with no per-scene changes.
- **`public/assets/`** — game assets. `data/` and `fonts/` are committed;
  `images/` and `audio/` are **gitignored dev placeholders** (Monster Tamer's
  art, not ours to ship — replace before production).
- **`legacy/quizmon-arena.html`** — the original QuizMon quiz battler, kept as
  the source for the quiz battle system.
- **`PLAN.md`** — the roadmap: what to change to turn this base into QuizMon.

> ⚠️ The bundled art/audio are development placeholders under other creators'
> licenses. See `PLAN.md` and `public/assets/ASSET-MANIFEST.md` — replace them
> all before shipping.

## Scripts
`npm run dev` · `npm run build` · `npm run preview` · `npm run fetch-assets`

## Credits
Base code: **Monster Tamer** by Dev Share Academy (MIT).

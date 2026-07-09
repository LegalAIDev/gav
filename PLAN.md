# QuizMon Overworld — build plan

This repo is an **overworld-RPG base** for QuizMon, built on top of the
MIT-licensed [Monster Tamer](https://github.com/devshareacademy/monster-tamer)
tutorial codebase (© Dev Share Academy). We use it as a running starting point:
a working Pokémon-style overworld (tile world, NPCs, encounters, save system,
menus) that we adapt into QuizMon.

This document is the source of truth for **what to change and in what order**.

---

## What's already been done (the base)

- **Vendored** the Monster Tamer game into `src/` + `public/assets/data`.
- **Vite + npm tooling** — `src/lib/phaser.js` and `src/lib/webfontloader.js`
  now import from npm instead of CDN `<script>` tags. Run with `npm run dev`.
- **Touch controls** — `src/utils/touch-input.js` renders an on-screen virtual
  joystick + A/B/Y buttons and feeds them into `src/utils/controls.js`. Because
  every scene reads input through the `Controls` class, the whole game
  (overworld + menus + battle) is touch-playable with **no per-scene changes**.
  - A = confirm (Enter/Space), B = back (Shift), Y = interact (F).
- **Assets are dev-only placeholders** — Monster Tamer's art/audio are fetched
  by `npm run fetch-assets` into `public/assets/{images,audio}`, which are
  **gitignored** and never committed. See "Assets" below.
- **Removed** the debug `TestScene` (it pulled Tweakpane from a CDN).
- **Legacy quiz battler** preserved at `legacy/quizmon-arena.html` — this is the
  game to mine for the QuizMon battle system (step 2 below).

Verify the base boots: `npm run dev`, then open the printed URL. On desktop the
joystick shows at reduced opacity for testing; drag it to move.

---

## Assets (read before shipping anything)

The images/audio are **Monster Tamer's, used only as development placeholders.**
They come from several artists (AxulArt, Pimen, Parabellum Games, Kenney,
xDeviruchi, Leohpaz) under their own licenses — they are NOT ours to ship.

- They live under `public/assets/images` and `public/assets/audio`, both
  **gitignored**. Nothing gets redistributed through this repo.
- `public/assets/ASSET-MANIFEST.md` tracks every asset category and its
  replacement status.
- **Before production: replace every placeholder** with our own licensed art and
  audio, keeping the same file paths/keys (see `src/scenes/preload-scene.js`),
  then check off the manifest.

---

## The plan

### 1. Rebrand the shell  *(quick wins)*
- [ ] Title/name: `index.html` `<title>`, `package.json` `name`, title scene text.
- [ ] Turn off Monster Tamer social links (already `SHOW_SOCIAL_LINKS = false` in
      `src/config.js`) and remove the GitHub/YouTube links in `title-scene.js`.
- [ ] Replace title art in `public/assets/images/monster-tamer/ui/title/`.

### 2. Quiz-driven battles  *(the core change — DONE, v1)*
The quiz concept is built **into** the existing overworld encounter → battle
flow, rather than as a separate screen. When the player chooses **Fight** and a
move, a quiz question must be answered to land the attack. This keeps every
Monster Tamer system (switch / item / flee / catch / exp) intact.

Implemented:
- [x] Question bank ported from `legacy/quizmon-arena.html` →
      `public/assets/data/questions.json` (loaded via `DataUtils.getQuestions`).
- [x] `src/battle/quiz/quiz-manager.js` — question selection (difficulty scales
      with monster level), streak tracking, and damage scaling (streak + answer
      speed).
- [x] `src/battle/quiz/quiz-ui.js` — Phaser panel: question, 2×2 options
      (joystick/arrow navigable **and** tappable), countdown bar, correct/wrong
      feedback.
- [x] `src/scenes/battle-scene.js` — new `PLAYER_QUIZ` battle state: choosing an
      attack routes to the quiz; a correct answer powers `#playerAttack` (damage
      = `baseAttack × multiplier`), a wrong answer / timeout makes it fizzle and
      the enemy still strikes.

Follow-ups / tuning:
- [ ] Tie question **category to the overworld area** (e.g. a "Math" route) —
      `pickQuestion({ category })` already supports it; wire area → category.
- [ ] Tune timer (15s), streak/speed multipliers in `quiz-manager.js`.
- [ ] Optional: port the legacy **energy/cards** layer for extra depth.
- [x] Replace Monster Tamer's monsters (`public/assets/data/monsters.json`,
      `encounters.json`) with QuizMon's own roster — 15 creatures extracted from
      the ChatGPT concept sheet to transparent PNGs under
      `public/assets/images/quizmon/monsters/`, grouped into three encounter
      routes (Dream Sprites / Memory Echoes / Insight Wisps).

### 3. Make the world ours
- [ ] Edit maps in [Tiled](https://www.mapeditor.org/); tilemaps are
      `public/assets/data/*.json`, tilesets are the map images. Keep the Tiled
      layer/object names the world scene expects (Collision, encounter zones,
      spawn, transitions, NPC layers, Events).
- [ ] Rewrite NPC dialog/signs (`public/assets/data/npcs.json`, `signs.json`).
- [ ] Replace character spritesheets (player/NPC) with our own.

### 4. Mobile polish
- [ ] Tune joystick/button size + position in `src/utils/touch-input.js`
      (constants: `RADIUS`, `DEADZONE`, CSS sizes).
- [ ] Optionally gate the overlay to touch devices only (remove the
      `@media (hover: hover)` desktop-opacity block, add a touch check).
- [ ] Consider step-repeat on held joystick for menu scrolling if desired.
- [ ] Test on a real phone: `npm run dev` prints a Network URL (`host: true`).

### 5. Production hardening
- [ ] Replace ALL placeholder assets; complete `ASSET-MANIFEST.md`.
- [ ] Remove `legacy/` once the quiz battle is fully ported.
- [ ] Code-split the Phaser bundle if load time matters (build warns it's >500 kB).
- [ ] Confirm licensing/attribution for every shipped asset.

---

## Commands
| command | what it does |
|---|---|
| `npm install` | install deps (also tries to fetch dev assets) |
| `npm run fetch-assets` | download Monster Tamer dev placeholder art/audio |
| `npm run dev` | start Vite dev server (LAN-accessible for phone testing) |
| `npm run build` | production build to `dist/` |
| `npm run preview` | serve the production build |

## Attribution
Base code: Monster Tamer by Dev Share Academy, MIT License. The original license
is preserved at `src/` provenance; keep an attribution note in production credits
if any original code remains.

# Asset manifest — replacement tracker

All image/audio assets under `public/assets/images` and `public/assets/audio`
are **Monster Tamer development placeholders** (committed to the repo; also
re-fetchable via `npm run fetch-assets`). They are **not licensed for us to
ship**. Replace each
category with our own licensed assets before production, keeping the same file
paths/keys (defined in `src/scenes/preload-scene.js`), then tick the box.

## Images  (`public/assets/images/`)
| category | path prefix | original source | replaced? |
|---|---|---|---|
| Monsters | `monster-tamer/monsters/` | Monster Tamer | ☐ |
| Battle backgrounds | `monster-tamer/battle-backgrounds/` | Monster Tamer | ☐ |
| Battle (balls, trainers) | `monster-tamer/battle/` | Monster Tamer | ☐ |
| Map: tilesets/levels | `monster-tamer/map/` | AxulArt | ☐ |
| Character sprites | `axulart/character/` | AxulArt | ☐ |
| NPC sprites | `parabellum-games/` | Parabellum Games | ☐ |
| Attack FX | `pimen/` | Pimen | ☐ |
| UI panels/buttons | `kenneys-assets/` | Kenney | ☐ |
| Title / party / inventory UI | `monster-tamer/ui/` | Monster Tamer | ☐ |

## Audio  (`public/assets/audio/`)
| category | path prefix | original source | replaced? |
|---|---|---|---|
| Music (title/main/battle) | `xDeviruchi/` | xDeviruchi | ☐ |
| SFX (steps, hits, flee) | `leohpaz/` | Leohpaz | ☐ |

## Fonts  (`public/assets/fonts/` — committed)
| font | license | replaced? |
|---|---|---|
| Kenney Future Narrow | see `fonts/kenneys-fonts/License.txt` | ☐ (Kenney fonts are permissively licensed; verify before ship) |

// Re-export Phaser from a vendored copy that lives in this repo, rather than
// from the bare `phaser` package specifier. A bare specifier (`from 'phaser'`)
// only resolves when a bundler (Vite) rewrites it; if the raw `src/` tree is
// ever served straight to the browser, the browser throws
// "Failed to resolve module specifier 'phaser'". Importing the vendored
// `./phaser.esm.js` by relative path resolves everywhere — Vite dev, the
// production build, and a plain static file server.
//
// `phaser.esm.js` is Phaser 3.60.0's ESM build (dist/phaser.esm.min.js),
// which exposes only named exports (Game, Scene, CANVAS, …) and no default,
// so we build the default the rest of the codebase imports from the namespace.
// To refresh it: `cp node_modules/phaser/dist/phaser.esm.min.js src/lib/phaser.esm.js`.
import * as Phaser from './phaser.esm.js';

export default Phaser;

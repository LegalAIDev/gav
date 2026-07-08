// Re-export Web Font Loader from a vendored copy instead of the bare
// `webfontloader` package specifier, for the same reason as ./phaser.js:
// a bare specifier only resolves under a bundler, so serving the raw `src/`
// tree would throw "Failed to resolve module specifier 'webfontloader'".
//
// `webfontloader.min.js` is the library's UMD build. Loaded as a module it
// finds no CommonJS `module`/AMD `define`, so it assigns the global
// `window.WebFont`, which we then re-export as the default. This resolves the
// same everywhere — Vite dev, the production build, and a plain static server.
// To refresh it: `cp node_modules/webfontloader/webfontloader.js src/lib/webfontloader.min.js`.
import './webfontloader.min.js';

export default window.WebFont;

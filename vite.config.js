import { defineConfig } from 'vite';

// Static assets (images/audio/data/fonts) live in `public/assets` and are served
// at `/assets/...`, matching the runtime paths Phaser loads them from.
export default defineConfig({
  base: './',
  server: {
    host: true, // expose on the network so you can test on a real phone
    port: 5173,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});

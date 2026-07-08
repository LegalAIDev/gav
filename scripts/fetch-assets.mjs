#!/usr/bin/env node
/**
 * Downloads the Monster Tamer image + audio assets (distributed separately from
 * the code, as a GitHub release zip) into public/assets/{images,audio}.
 *
 * These assets are used ONLY as development placeholders. They are gitignored
 * and MUST be replaced with your own licensed art/audio before production —
 * see PLAN.md and public/assets/ASSET-MANIFEST.md.
 *
 * Usage: npm run fetch-assets   (also runs automatically after `npm install`)
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSET_URL =
  'https://github.com/devshareacademy/monster-tamer/releases/download/assets/all-game-assets-v2.zip';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'public', 'assets');
const cacheDir = join(root, '.asset-cache');
const zipPath = join(cacheDir, 'monster-tamer-assets.zip');
const extractDir = join(cacheDir, 'extracted');

const imagesTarget = join(assetsDir, 'images');
const audioTarget = join(assetsDir, 'audio');

function alreadyFetched() {
  return (
    existsSync(imagesTarget) &&
    readdirSync(imagesTarget).length > 0 &&
    existsSync(audioTarget) &&
    readdirSync(audioTarget).length > 0
  );
}

function findDir(startDir, name) {
  const stack = [startDir];
  while (stack.length) {
    const dir = stack.shift(); // breadth-first -> shallowest match
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === name) return full;
        stack.push(full);
      }
    }
  }
  return null;
}

function download() {
  console.log(`[fetch-assets] downloading ${ASSET_URL}`);
  // curl is available on macOS/Linux and modern Windows; -L follows redirects.
  execSync(`curl -fSL "${ASSET_URL}" -o "${zipPath}"`, { stdio: 'inherit' });
}

function extract() {
  rmSync(extractDir, { recursive: true, force: true });
  mkdirSync(extractDir, { recursive: true });
  try {
    execSync(`unzip -q -o "${zipPath}" -d "${extractDir}"`, { stdio: 'inherit' });
  } catch {
    // Fallback for environments without `unzip` (e.g. bare Windows): tar can read zips.
    execSync(`tar -xf "${zipPath}" -C "${extractDir}"`, { stdio: 'inherit' });
  }
}

function install() {
  const imagesSrc = findDir(extractDir, 'images');
  const audioSrc = findDir(extractDir, 'audio');
  if (!imagesSrc || !audioSrc) {
    throw new Error(
      `Could not find images/ and audio/ folders in the downloaded archive. ` +
        `Inspect ${extractDir} and adjust scripts/fetch-assets.mjs.`
    );
  }
  mkdirSync(assetsDir, { recursive: true });
  cpSync(imagesSrc, imagesTarget, { recursive: true });
  cpSync(audioSrc, audioTarget, { recursive: true });
  console.log(`[fetch-assets] installed images -> ${imagesTarget}`);
  console.log(`[fetch-assets] installed audio  -> ${audioTarget}`);
}

try {
  if (alreadyFetched()) {
    console.log('[fetch-assets] assets already present, skipping. Delete public/assets/images to refetch.');
    process.exit(0);
  }
  mkdirSync(cacheDir, { recursive: true });
  download();
  extract();
  install();
  console.log('[fetch-assets] done. (Dev placeholders — replace before production, see PLAN.md)');
} catch (err) {
  console.error(`[fetch-assets] FAILED: ${err.message}`);
  console.error(`[fetch-assets] You can download manually from:\n  ${ASSET_URL}`);
  console.error(`[fetch-assets] then extract its images/ and audio/ folders into public/assets/`);
  process.exit(1);
}

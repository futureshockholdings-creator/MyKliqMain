#!/usr/bin/env node
/**
 * generate-precache.js
 *
 * Runs after `vite build`. Reads dist/assets/ to find all hashed JS/CSS
 * files and rewrites dist/sw.js so the service worker pre-caches them at
 * install time.  Without this, PWABuilder's offline test loads cached
 * index.html but fails because the hashed JS bundles are not in the cache.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distDir   = path.join(__dirname, '..', 'dist');
const swPath    = path.join(distDir, 'sw.js');
const assetsDir = path.join(distDir, 'assets');

// --- collect hashed assets ---------------------------------------------------
const assetFiles = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir)
      .filter(f => /\.(js|css)$/.test(f))
      .map(f => `/assets/${f}`)
  : [];

const allAssets = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png',
  ...assetFiles,
];

// --- patch dist/sw.js --------------------------------------------------------
let sw = fs.readFileSync(swPath, 'utf8');

const arrayLiteral =
  '[\n' + allAssets.map(p => `  '${p}'`).join(',\n') + '\n]';

sw = sw.replace(
  /const PRECACHE_ASSETS\s*=\s*\[[\s\S]*?\];/,
  `const PRECACHE_ASSETS = ${arrayLiteral};`
);

fs.writeFileSync(swPath, sw, 'utf8');

console.log(`[generate-precache] Patched dist/sw.js with ${allAssets.length} assets:`);
allAssets.forEach(a => console.log(`  ${a}`));

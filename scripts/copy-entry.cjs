/**
 * Copies the ESM entry wrapper to dist-electron/main.mjs after vite build.
 * The wrapper loads electron APIs via ESM import and patches require()
 * so the CJS bundle (dist-electron/main.js) can use require('electron').
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'electron', 'entry.mjs');
const dest = path.join(__dirname, '..', 'dist-electron', 'main.mjs');

if (!fs.existsSync(src)) {
  console.error('ERROR: entry.mjs not found at', src);
  process.exit(1);
}

// Ensure dist-electron exists
const destDir = path.dirname(dest);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('Copied entry.mjs → dist-electron/main.mjs');

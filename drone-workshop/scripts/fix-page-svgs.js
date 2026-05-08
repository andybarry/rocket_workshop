#!/usr/bin/env node
/**
 * Ensures every page SVG under `src/assets/images/pages/` has explicit
 * `width="816" height="1056"` attributes on its root `<svg>` element.
 *
 * Background: Slides/Figma/Illustrator often re-export SVGs with only a
 * `viewBox` and no width/height. When the browser loads such an SVG via
 * `<img>`, it reports a 300x150 natural size, which throws off every
 * `(px / imageNaturalSize) * 100%` calculation in `InstructionsPanel.jsx`
 * and breaks all overlay scaling/positioning.
 *
 * This script runs before `npm start` and `npm run build` (see package.json
 * `prestart` / `prebuild` hooks) so re-exports always end up with the
 * correct attributes without manual cleanup.
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'src', 'assets', 'images', 'pages');
const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;

function ensureSvgDimensions(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const svgOpenMatch = original.match(/<svg\b[^>]*>/i);
  if (!svgOpenMatch) return { changed: false, reason: 'no <svg> tag found' };

  const svgOpen = svgOpenMatch[0];
  const widthAttr = svgOpen.match(/\swidth\s*=\s*"([^"]*)"/i);
  const heightAttr = svgOpen.match(/\sheight\s*=\s*"([^"]*)"/i);
  const widthOk = widthAttr && widthAttr[1] === String(PAGE_WIDTH);
  const heightOk = heightAttr && heightAttr[1] === String(PAGE_HEIGHT);

  if (widthOk && heightOk) return { changed: false };

  let updatedOpen = svgOpen;

  if (widthAttr) {
    updatedOpen = updatedOpen.replace(/\swidth\s*=\s*"[^"]*"/i, ` width="${PAGE_WIDTH}"`);
  } else {
    updatedOpen = updatedOpen.replace(/<svg\b/i, `<svg width="${PAGE_WIDTH}"`);
  }

  if (heightAttr) {
    updatedOpen = updatedOpen.replace(/\sheight\s*=\s*"[^"]*"/i, ` height="${PAGE_HEIGHT}"`);
  } else {
    updatedOpen = updatedOpen.replace(
      /<svg(\s+width="[^"]*")?/i,
      (match) => `${match} height="${PAGE_HEIGHT}"`,
    );
  }

  const updated = original.replace(svgOpen, updatedOpen);
  fs.writeFileSync(filePath, updated, 'utf8');
  const addedWidth = !widthAttr;
  const addedHeight = !heightAttr;
  return {
    changed: true,
    addedWidth,
    addedHeight,
    normalizedWidth: widthAttr && !widthOk,
    normalizedHeight: heightAttr && !heightOk,
  };
}

function patchOne(file) {
  try {
    const result = ensureSvgDimensions(file);
    if (result.changed) {
      const parts = [];
      if (result.addedWidth) parts.push(`added width="${PAGE_WIDTH}"`);
      else if (result.normalizedWidth) parts.push(`normalized width="${PAGE_WIDTH}"`);
      if (result.addedHeight) parts.push(`added height="${PAGE_HEIGHT}"`);
      else if (result.normalizedHeight) parts.push(`normalized height="${PAGE_HEIGHT}"`);
      console.log(`[fix-page-svgs] patched ${path.basename(file)}: ${parts.join('; ')}`);
    }
    return result.changed;
  } catch (err) {
    console.warn(`[fix-page-svgs] failed to process ${file}: ${err.message}`);
    return false;
  }
}

function patchAll() {
  if (!fs.existsSync(PAGES_DIR)) {
    console.warn(`[fix-page-svgs] pages directory not found: ${PAGES_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(PAGES_DIR)
    .filter((name) => name.toLowerCase().endsWith('.svg'))
    .map((name) => path.join(PAGES_DIR, name));

  let fixedCount = 0;
  for (const file of files) {
    if (patchOne(file)) fixedCount += 1;
  }

  if (fixedCount === 0) {
    console.log(`[fix-page-svgs] checked ${files.length} SVG(s); no changes needed`);
  } else {
    console.log(`[fix-page-svgs] patched ${fixedCount} of ${files.length} SVG(s)`);
  }
}

function watch() {
  patchAll();
  console.log(`[fix-page-svgs] watching ${PAGES_DIR} for SVG changes...`);

  // Debounce per-file: design tools often rewrite a file in multiple events
  const pending = new Map();
  const DEBOUNCE_MS = 150;

  fs.watch(PAGES_DIR, { persistent: true }, (eventType, filename) => {
    if (!filename) return;
    if (!filename.toLowerCase().endsWith('.svg')) return;

    const fullPath = path.join(PAGES_DIR, filename);
    if (pending.has(filename)) clearTimeout(pending.get(filename));
    pending.set(
      filename,
      setTimeout(() => {
        pending.delete(filename);
        if (fs.existsSync(fullPath)) patchOne(fullPath);
      }, DEBOUNCE_MS),
    );
  });
}

const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('-w')) {
  watch();
} else {
  patchAll();
}

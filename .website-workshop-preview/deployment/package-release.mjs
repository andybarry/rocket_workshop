import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { parse } = createRequire(import.meta.url)('../../ai-web-workshop/node_modules/acorn');

const deployment = path.dirname(fileURLToPath(import.meta.url));
const source = path.dirname(deployment);
const releaseId = 'studio-' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const output = path.join(deployment, releaseId);
fs.mkdirSync(output);
for (const app of ['website-workshop', 'manage-servers']) {
  fs.cpSync(path.join(source, app), path.join(output, app), { recursive: true });
}
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const changedBundles = [
  { app: 'website-workshop', original: 'assets/index-fkdtBi_i.js', entry: 'studio-bootstrap.js', prefix: 'assets/index-' },
  { app: 'manage-servers', original: 'static/js/main.7e1f137c.js', entry: 'index.html', prefix: 'static/js/main.' },
];
const renamed = {};
for (const item of changedBundles) {
  const appRoot = path.join(output, item.app);
  const bytes = fs.readFileSync(path.join(appRoot, item.original));
  const replacement = item.prefix + sha256(bytes).slice(0, 16) + '.js';
  fs.renameSync(path.join(appRoot, item.original), path.join(appRoot, replacement));
  const entry = path.join(appRoot, item.entry);
  const text = fs.readFileSync(entry, 'utf8');
  if (!text.includes(item.original)) throw new Error('Missing bundle reference: ' + item.entry);
  fs.writeFileSync(entry, text.replaceAll(item.original, replacement));
  renamed[item.app] = { from: item.original, to: replacement };
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const files = walk(output).map(file => {
  if (/\.(m?js|cjs)$/.test(file)) {
    // Parse as the browser will, even when Node's module auto-detection differs.
    parse(fs.readFileSync(file, 'utf8'), {
      ecmaVersion: 'latest', sourceType: file.endsWith('.cjs') ? 'script' : 'module',
    });
  }
  return { path: path.relative(output, file).replaceAll('\\', '/'), sha256: sha256(fs.readFileSync(file)) };
});
fs.writeFileSync(path.join(output, 'release.json'), JSON.stringify({ releaseId, createdAt: new Date().toISOString(), renamed, files }, null, 2) + '\n');
fs.writeFileSync(path.join(deployment, 'current-release.txt'), releaseId + '\n');
console.log(JSON.stringify({ releaseId, output, fileCount: files.length, renamed }, null, 2));

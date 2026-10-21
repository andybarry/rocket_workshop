import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const releaseId = fs.readFileSync(path.join(root, 'current-release.txt'), 'utf8').trim();
const manifest = JSON.parse(fs.readFileSync(path.join(root, releaseId, 'release.json'), 'utf8'));
const results = [];
for (let i = 0; i < manifest.files.length; i += 4) {
  const group = await Promise.all(manifest.files.slice(i, i + 4).map(async file => {
    const response = await fetch('https://ai.stageoneeducation.com/' + file.path, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
    const bytes = Buffer.from(await response.arrayBuffer());
    const actual = crypto.createHash('sha256').update(bytes).digest('hex');
    const contentType = response.headers.get('content-type');
    // A byte-for-byte matching module still cannot run with a download MIME type.
    const scriptTypeValid = !/\.m?js$/.test(file.path) ||
      /^(text|application)\/(javascript|ecmascript)(;|$)/i.test(contentType || '');
    return { path: file.path, status: response.status, matches: actual === file.sha256, scriptTypeValid, contentType, cacheControl: response.headers.get('cache-control') };
  }));
  results.push(...group);
}
const report = { releaseId, verifiedAt: new Date().toISOString(), passed: results.every(r => r.status === 200 && r.matches && r.scriptTypeValid), results };
fs.writeFileSync(path.join(root, releaseId, 'live-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ releaseId, passed: report.passed, filesVerified: results.length, failures: results.filter(r => r.status !== 200 || !r.matches || !r.scriptTypeValid) }, null, 2));
if (!report.passed) process.exitCode = 1;

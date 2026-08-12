/* Decodes a saved Page.captureScreenshot CDP response into a PNG. */
const fs = require('fs');
const src = process.argv[2];
const out = process.argv[3];
const payload = JSON.parse(fs.readFileSync(src, 'utf8'));
const data = payload.data || (payload.result && payload.result.data);
if (!data) throw new Error('no image data in ' + src);
fs.writeFileSync(out, Buffer.from(data, 'base64'));
console.log(out);

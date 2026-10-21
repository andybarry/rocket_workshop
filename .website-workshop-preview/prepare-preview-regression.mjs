// Creates an isolated test artifact from the actual compiler, without mounting
// the studio, reading a user session, or running its autosave effects.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('./', import.meta.url);
let bundle = readFileSync(new URL('website-workshop/assets/index-fkdtBi_i.js', root), 'utf8');
const mount = 'l9t.createRoot(document.getElementById("root")).render(Q.jsx(Nn.StrictMode,{children:Q.jsx(Fdr,{})}));';
if (bundle.split(mount).length !== 2) throw new Error('Studio entry point changed');
bundle = bundle.replace(mount, 'export { m_ as compilePreview };');
bundle = bundle.replace(/from "\.\.\/([^"]+)"/g, 'from "../website-workshop/$1"');
bundle = bundle.replace('import("./html2canvas.esm-QH1iLAAe.js")', 'import("../website-workshop/assets/html2canvas.esm-QH1iLAAe.js")');
mkdirSync(new URL('tests/', root), { recursive: true });
writeFileSync(new URL('tests/compiler.fixture.js', root), bundle);
console.log('Prepared isolated compiler fixture.');

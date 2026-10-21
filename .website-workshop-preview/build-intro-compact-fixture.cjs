// Browser fixture using the production JSX and submit handlers with local AI doubles.
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('../ai-web-workshop/node_modules/acorn');
const esbuild = require('../ai-web-workshop/node_modules/esbuild');
const source = fs.readFileSync(path.join(__dirname, 'website-workshop/assets/index-fkdtBi_i.js'), 'utf8');
const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
const functions = new Map(ast.body.filter(node => node.type === 'FunctionDeclaration').map(node => [node.id.name, node]));
const root = functions.get('Fdr');
let workspace;
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'CallExpression' && node.arguments?.[1]?.type === 'ObjectExpression' &&
      node.arguments[1].properties.some(prop => prop.key?.name === 'className' && prop.value?.value === 'left-section studio-workspace')) workspace = node;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(root);
if (!workspace) throw new Error('Production Create workspace not found');
const componentSource = ['a$t', 's$t', 'Fqt', 'brr', 'Brr'].map(name => {
  const node = functions.get(name);
  return source.slice(node.start, node.end);
}).join('\n');
const stateSource = root.body.body.slice(0, 3).map(node => source.slice(node.start, node.end)).join('\n');
const fixtureSource = `
import * as Je from 'react';
import * as Q from 'react/jsx-runtime';
import { createRoot } from 'react-dom/client';
const EOe=[{id:'fixture',name:'Test voice',gender:'F'}],Srr=[{id:'image',label:'Image'},{id:'audio',label:'Voice'}];
const $$e=()=>()=>{},qUt=()=>()=>{},AUt=()=>{},_Ut=()=>[],Lx=()=>null,ls=()=>{},z$e=()=>'convert',q$e='Add a page';
const bRe=async(messages,append)=>{append('Local test response. No website files were changed.');};
const BUt=bRe,py=async()=>{},vqt=async()=>'',Eqt=()=>'image',Crr=()=>'audio';
class wn { constructor(){this.images={generate:async()=>{throw new Error('Local image test response — no API request made.');}};} }
const vrr={ElevenLabsClient:class {constructor(){this.textToSpeech={convertAsStream:async()=>{throw new Error('Local voice test response — no API request made.');}};}}};
const o$t=()=>null,wrr=()=>null,cte=()=>Q.jsx('p',{children:'Local test gallery'});
const l$t=({content})=>Q.jsx('span',{children:content});
${componentSource}
function Fixture(){
  ${stateSource}
  const [V,Ht]=Je.useState([]),Oe=Je.useRef(null),it=()=>{},_t={openaiKey:'local-test-only',elevenlabsKey:'local-test-only',imageModel:'gpt-image-test'};
  return ${source.slice(workspace.start, workspace.end)};
}
createRoot(document.getElementById('fixture')).render(Q.jsx(Fixture,{}));
`;
const fixtureWidth = Number(process.argv[2] || 440), fixtureHeight = Number(process.argv[3] || 620);
if (![fixtureWidth, fixtureHeight].every(value => Number.isFinite(value) && value >= 200 && value <= 1600)) throw new Error('Invalid fixture size');
const out = path.join(__dirname, 'intro-compact-fixture');
fs.mkdirSync(out, { recursive: true });
esbuild.buildSync({
  stdin: { contents: fixtureSource, resolveDir: path.join(__dirname, '../ai-web-workshop'), sourcefile: 'intro-compact-fixture.jsx' },
  bundle: true, format: 'esm', outfile: path.join(out, 'fixture.js'),
});
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Create introduction interaction test</title>
<link rel="stylesheet" href="/website-workshop/assets/index-DZ8Uda5V.css"><link rel="stylesheet" href="/website-workshop/local-overrides.css">
<style>body{margin:0;padding:24px;background:#f8f9fa;font-family:system-ui}h1{font-size:18px;margin:0 0 16px;color:#434343}#fixture{height:${fixtureHeight}px}.studio-workspace{width:${fixtureWidth}px;height:100%;container:create-card / inline-size;border:2px solid #b8bec7;border-radius:10px;overflow:hidden;display:flex;flex-direction:column} .studio-create-header{--chrome-nav:24px;--chrome-section:#d1d6dd}</style></head><body><h1>Create introduction interaction test · simulated AI responses</h1><div id="fixture"></div><script type="module" src="./fixture.js"></script></body></html>`);
console.log('Built isolated fixture from production components; no generation services connected.');

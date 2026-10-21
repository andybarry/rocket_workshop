import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { rewriteStudentModule } from '../website-workshop/module-compiler.js';
const require = createRequire(import.meta.url);
const acorn = require('../../ai-web-workshop/node_modules/acorn');
const Babel = require('../../../music-gen/website-workshop/node_modules/@babel/standalone');
const source = fs.readFileSync(new URL('../website-workshop/assets/index-fkdtBi_i.js', import.meta.url), 'utf8');
const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
const context = { pUt: Babel, rewriteStudentModule, P$e: {}, installPreviewHashNavigation() {} };
vm.createContext(context);
for (const name of ['m_', 'EUt', 'mS', 'CUt', 'vUt']) {
  const node = ast.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === name);
  vm.runInContext(source.slice(node.start, node.end), context);
}
export const compile = context.m_;
export function loadChatComponent(dependencies) {
  const node = ast.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 's$t');
  return vm.runInNewContext(source.slice(node.start, node.end) + '; s$t;', dependencies);
}
export async function evaluateProject(files, mocks = {}) {
  const result = compile(files);
  if (result.error) throw new Error(result.error);
  const script = result.html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  acorn.parse(script, { ecmaVersion: 'latest', sourceType: 'module' });
  const registry = script.split('// === Boot ===')[0];
  return vm.runInNewContext(registry + '\n__import = async name => mocks[name] || {}; __require("App.jsx");', { mocks });
}

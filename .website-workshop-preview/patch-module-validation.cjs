const fs = require('node:fs');
const acorn = require('../ai-web-workshop/node_modules/acorn');
const esbuild = require('../ai-web-workshop/node_modules/esbuild');
const file = __dirname + '/website-workshop/assets/index-fkdtBi_i.js';
let bundle = fs.readFileSync(file, 'utf8');
if (bundle.includes('rewriteStudentModule')) throw new Error('Compiler patch already installed');
fs.writeFileSync(__dirname + '/debug-runtime/before-module-validation.js', bundle);
const ast = acorn.parse(bundle, { ecmaVersion: 'latest', sourceType: 'module' });
const edits = [];
const get = name => ast.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === name);
const readable = node => esbuild.transformSync(bundle.slice(node.start, node.end), { minify: false }).code;
const once = (text, old, next) => {
  if (text.split(old).length !== 2) throw new Error('Expected one match: ' + old.slice(0, 100));
  return text.replace(old, next);
};
const replace = (name, code) => {
  const node = get(name);
  acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  edits.push({ start: node.start, end: node.end, code });
};
replace('EUt', 'function EUt(code, filename, files) { return rewriteStudentModule(pUt, code, filename, files); }');

let compiler = readable(get('m_'));
compiler = once(compiler, 'presets: ["react"]', 'presets: /\\.tsx?$/.test(h) ? ["react", "typescript"] : ["react"]');
compiler = once(compiler, 'EUt(v, h)', 'EUt(v, h, a)');
compiler = once(compiler, '"App.js" in f ? "App.js" : Object.keys(f)[0]',
  '"App.js" in f ? "App.js" : "App.tsx" in f ? "App.tsx" : "App.ts" in f ? "App.ts" : Object.keys(f)[0]');
compiler = once(compiler, 'return { html: `<!DOCTYPE', 'pUt.transform(_, { filename: "preview-runtime.js", sourceType: "module", code: false, ast: false });\n    return { html: `<!DOCTYPE');
compiler = once(compiler, '${_}', '${_.replace(/<\\/script/gi, "<\\\\/script")}');
replace('m_', compiler);

let registry = readable(get('vUt'));
registry = once(registry, 'const __moduleCache = {};', `const __moduleCache = {};
const __externalModules = new Map();
async function __import(specifier) {
  if (!__externalModules.has(specifier)) __externalModules.set(specifier, import(specifier).then(namespace => {
    if (specifier !== "react-router-dom") return namespace;
    window.__ensureIdeRouter(namespace);
    return Object.assign({}, namespace, {
      BrowserRouter: window.__IdeRouter, HashRouter: window.__IdeRouter, MemoryRouter: window.__IdeRouter,
      createBrowserRouter: namespace.createMemoryRouter, createHashRouter: namespace.createMemoryRouter,
    });
  }));
  return __externalModules.get(specifier);
}`);
registry = once(registry, 'console.warn("Module not found:", name);\n    return {};',
  'throw new Error("Cannot find project module: " + name);');
registry = once(registry, 'await __modules[name](exports, __require);', `try {
    await __modules[name](exports, __require, __import);
  } catch (error) {
    delete __moduleCache[name];
    error.message = name + ": " + error.message;
    throw error;
  }`);
registry = once(registry, '`__register("${u}", async function(__exports, __require) {\n  const React = await import("react");\n  const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext } = React;',
  '`__register(${JSON.stringify(u)}, async function(__exports, __require, __import) {');
registry = once(registry, '__require("${n}")', '__require(${JSON.stringify(n)})');
replace('vUt', registry);

let chat = readable(get('s$t'));
chat = once(chat, 'const j = Je.useRef(null), I = Je.useRef(false);',
  'const j = Je.useRef(null), I = Je.useRef(false), turnRef = Je.useRef(null);');
chat = once(chat, 'z(De, (se, xe) => bRe(se, xe));', 'z(De, (se, xe) => bRe(se, xe), true);');
chat = once(chat, 'AUt(), h(false);', 'if (turnRef.current) turnRef.current.cancelled = true; AUt(), h(false);');
const start = chat.indexOf('  function O(Z, De) {');
const end = chat.indexOf('  async function G(Z) {');
if (start < 0 || end < start) throw new Error('Chat apply flow not found');
chat = chat.slice(0, start) + `  async function z(message, send, isRepair = false) {
    const turn = { cancelled: false, workshop: qc(), node: Vc() };
    turnRef.current = turn;
    const current = { ...za() };
    const messages = [...S.current, { role: "user", content: message }];
    const assistant = { role: "assistant", content: "" };
    const cancelled = () => turn.cancelled || turnRef.current !== turn || qc() !== turn.workshop || Vc() !== turn.node;
    const update = () => { if (!cancelled()) n([...messages, { ...assistant }]); };
    update(); h(true);
    const history = messages.map(({ role, content }) => ({ role, content }));
    try {
      const result = await generateValidatedChange({
        files: current, parse: _Ut, compile: files => m_(files), requireChanges: isRepair,
        isCancelled: cancelled,
        send: onChunk => send(history, onChunk),
        repair: (failure, onChunk) => bRe([...history,
          { role: "assistant", content: failure.response },
          { role: "user", content: "The proposed files failed the workshop compiler and were NOT applied. Correct the error below and return complete replacement file blocks. Preserve the requested design and behavior. Do not rename identifiers merely to change the error.\\n\\n" + failure.message }
        ], onChunk),
        onResponse: content => { assistant.content = content; update(); },
      });
      if (cancelled()) return;
      if (result.blocks.length) {
        const latest = za();
        if (result.blocks.some(block => latest[block.path] !== current[block.path])) {
          throw new Error("Your code changed while the AI was working. Your edits were kept; send the request again to update them.");
        }
        const checked = validateGeneratedFiles(latest, result.blocks, files => m_(files));
        if (checked.error) throw new Error("The update was not applied. Your current website is unchanged.\\n\\n" + checked.error);
        const checkpointId = Lx(message.slice(0, 60) || "AI change");
        Tx(checked.candidate);
        Object.assign(assistant, { filesChanged: result.blocks.map(block => block.path), checkpointId });
      }
      update();
    } catch (error) {
      if (!cancelled() && error.name !== "AbortError") {
        assistant.content = error.message;
        update();
      }
    } finally {
      if (turnRef.current === turn) h(false);
    }
  }
` + chat.slice(end);
replace('s$t', chat);
for (const edit of edits.sort((a, b) => b.start - a.start)) bundle = bundle.slice(0, edit.start) + edit.code + bundle.slice(edit.end);
bundle = 'import { rewriteStudentModule } from "../module-compiler.js";\n' +
  'import { generateValidatedChange, validateGeneratedFiles } from "../generation-validation.js";\n' + bundle;
acorn.parse(bundle, { ecmaVersion: 'latest', sourceType: 'module' });
fs.writeFileSync(file + '.tmp', bundle);
fs.renameSync(file + '.tmp', file);
console.log('Installed parser-based module compilation and validated generation application.');

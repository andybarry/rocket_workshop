import test from 'node:test';
import assert from 'node:assert/strict';
import { compile, evaluateProject, loadChatComponent } from './compiler-harness.mjs';
import { generateValidatedChange, validateGeneratedFiles } from '../website-workshop/generation-validation.js';

test('Demo/B26 parent-directory imports compile, including unused pages', async () => {
  const files = {
    'App.jsx': 'import Home from "./pages/Home"; export default Home;',
    'pages/Home.jsx': 'import fishList from "../reefFishData"; export default fishList[0].name;',
    'pages/Gallery.jsx': 'import fishList from "../reefFishData"; export default fishList;',
    'reefFishData.js': 'export default [{name:"Clownfish"}];',
  };
  assert.equal((await evaluateProject(files)).default, 'Clownfish');
});

test('local resolution uses the importing directory and index files', async () => {
  assert.equal((await evaluateProject({
    'App.jsx': 'import label from "./pages"; export default label;',
    'pages/index.js': 'export { default } from "./nested/Label";',
    'pages/nested/Label.jsx': 'import { label as text } from "../../data"; export default text;',
    'data.ts': 'export const label: string = "reef";',
  })).default, 'reef');
});

test('named, default, namespace and re-exports preserve values and live exports', async () => {
  const output = await evaluateProject({
    'App.jsx': 'import initial, {count, inc} from "./bridge"; import * as all from "./counter"; inc(); export default [initial,count,all.count];',
    'bridge.js': 'export { default } from "./counter"; export * from "./counter";',
    'counter.js': 'export let count = 1; export function inc(){count++;} export default 0;',
  });
  assert.deepEqual(Array.from(output.default), [0, 2, 2]);
});

test('import/export words inside strings, templates and comments remain unchanged', async () => {
  const value = 'import fish from "../reefFishData"; export default fish';
  const output = await evaluateProject({ 'App.jsx': `// import Missing from "./not-a-file"\nexport default ${JSON.stringify(value)};` });
  assert.equal(output.default, value);
});

test('aliased React imports and unimported JSX React do not collide', async () => {
  const React = { createElement: (tag, props, ...children) => ({tag, children}), useState: x => [x] };
  const output = await evaluateProject({
    'App.jsx': 'import {useState as state} from "react"; export default function App(){const [x]=state("ok");return <p>{x}</p>}',
  }, {react: React});
  assert.equal(output.default().children[0], 'ok');
});

test('dynamic relative imports stay promises in ordinary functions', async () => {
  const output = await evaluateProject({
    'App.jsx': 'export default function load(){return import("./data")}',
    'data.js': 'export default "loaded";',
  });
  assert.equal((await output.default()).default, 'loaded');
});

test('missing paths and invalid source fail before a preview document is returned', () => {
  for (const files of [
    {'App.jsx':'import value from "./missing"; export default value;'},
    {'App.jsx':'import value from "../outside"; export default value;'},
    {'App.jsx':'export default function App( {'},
  ]) {
    const result = compile(files);
    assert.equal(result.html, null);
    assert.match(result.error, /App.jsx/);
  }
});

test('script-ending text cannot truncate the HTML module script', () => {
  const result = compile({'App.jsx':'export default "</script>";'});
  assert.equal(result.error, null);
  assert.match(result.html, /<\\\/script>/);
});

const original = {'App.jsx':'export default "original";'};
const parse = text => [{path:'App.jsx',content:text}];
test('invalid AI output is repaired and only a validated candidate is returned', async () => {
  let calls = 0;
  const result = await generateValidatedChange({files:original, parse, compile,
    send:async chunk => chunk('export default ;'),
    repair:async (error, chunk) => { calls++; assert.match(error.message,/App.jsx/); chunk('export default "repaired";'); },
    onResponse() {},
  });
  assert.equal(calls,1);
  assert.equal(result.candidate['App.jsx'],'export default "repaired";');
  assert.equal(original['App.jsx'],'export default "original";');
});

test('repeated invalid repairs stop after two attempts and preserve current files', async () => {
  let calls=0;
  await assert.rejects(generateValidatedChange({files:original, parse, compile,
    send:async chunk=>chunk('export default ;'),
    repair:async (error,chunk)=>{calls++;chunk('export default ;');},onResponse(){},
  }), /kept unchanged/);
  assert.equal(calls,2);
  assert.equal(original['App.jsx'],'export default "original";');
});

test('Stop never applies a partial response or launches another repair', async () => {
  let stopped=false,calls=0;
  await assert.rejects(generateValidatedChange({files:original,parse,compile,
    send:async chunk=>{chunk('export default "partial";');stopped=true;},
    repair:async()=>{calls++;},onResponse(){},isCancelled:()=>stopped,
  }), {name:'AbortError'});
  assert.equal(calls,0);
});

test('Fix error requires code changes, not just an AI claim that it is fixed', async () => {
  let calls=0;
  await assert.rejects(generateValidatedChange({files:original,parse:()=>[],compile,
    requireChanges:true,send:async chunk=>chunk('Fixed!'),
    repair:async (error,chunk)=>{calls++;chunk('Fixed!');},onResponse(){},
  }), /No complete file changes/);
  assert.equal(calls,2);
});

test('production chat flow commits a repaired response once, after validation', async () => {
  let stateCalls=0, stored={...original}, writes=0, checkpoints=0, sends=0;
  const updates=[];
  const element=(type,props)=>({type,props});
  const component=loadChatComponent({
    Je:{useState:value=>[stateCalls++===0?'Build a reef website':value,()=>{}],useRef:value=>({current:value}),useEffect(){},useLayoutEffect(){}},
    Q:{jsx:element,jsxs:element,Fragment:'fragment'},a$t(){},l$t(){},o$t(){},
    qc:()=> 'fixture',Vc:()=> 'B1',za:()=>stored,Tx:files=>{writes++;stored=files;},
    Lx:()=>{checkpoints++;return 'checkpoint';},_Ut:parse,m_:compile,
    generateValidatedChange,validateGeneratedFiles,
    bRe:async(history,chunk)=>{sends++;chunk(sends===1?'export default ;':'export default "reef";');},
  });
  const tree=component({chatMessages:[],setChatMessages:messages=>updates.push(messages)});
  const findForm=node=>!node||typeof node!=='object'?null:node.type==='form'?node:
    (Array.isArray(node)?node:node.props?.children?[node.props.children]:[]).map(findForm).find(Boolean);
  await findForm(tree).props.onSubmit({preventDefault(){}});
  assert.equal(sends,2);
  assert.equal(writes,1);
  assert.equal(checkpoints,1);
  assert.equal(stored['App.jsx'],'export default "reef";');
  assert.equal(updates.at(-1).at(-1).filesChanged[0],'App.jsx');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { installPreviewHashNavigation } from './website-workshop/preview-navigation.js';
import { guardStudioStartup } from './website-workshop/preview-safety.js';

function anchorFixture(href, { target = true, prevented = false } = {}) {
  let click, scrolls = 0, topScrolls = 0, preventedByBridge = false;
  const context = {
    document: {
      addEventListener: (_, handler) => { click = handler; },
      getElementById: id => target && id === 'studio' ? { scrollIntoView: () => { scrolls++; } } : null,
      getElementsByName: () => [],
    },
    window: { scrollTo: () => { topScrolls++; } },
    requestAnimationFrame: callback => callback(),
  };
  vm.runInNewContext(`(${installPreviewHashNavigation.toString()})();`, context);
  click({
    defaultPrevented: prevented,
    target: { closest: () => ({ getAttribute: () => href }) },
    preventDefault: () => { preventedByBridge = true; },
  });
  return { scrolls, topScrolls, preventedByBridge };
}

test('fragment links scroll locally and never navigate the frame', () => {
  assert.deepEqual(anchorFixture('#studio'), { scrolls: 1, topScrolls: 0, preventedByBridge: true });
  assert.equal(anchorFixture('#%73tudio').scrolls, 1);
  assert.equal(anchorFixture('#').topScrolls, 1);
  assert.equal(anchorFixture('#top', { target: false }).topScrolls, 1);
  for (const href of ['#missing', '#%zz']) {
    assert.deepEqual(anchorFixture(href), { scrolls: 0, topScrolls: 0, preventedByBridge: true });
  }
});

test('page links, external links and inspector-handled clicks are untouched', () => {
  for (const href of ['/about', 'https://example.com', 'mailto:hello@example.com']) {
    assert.equal(anchorFixture(href).preventedByBridge, false);
  }
  assert.equal(anchorFixture('#studio', { prevented: true }).scrolls, 0);
});

test('bootstrap blocks only managed preview frames, before app initialization', () => {
  const messages = [];
  const top = { name: '' }; top.parent = top;
  assert.equal(guardStudioStartup(top), false);
  const parent = { postMessage: message => messages.push(message) };
  assert.equal(guardStudioStartup({ parent, name: '', frameElement: { matches: () => false } }), false);
  assert.equal(guardStudioStartup({
    parent, name: '',
    frameElement: { matches: () => true, dataset: { workshopPreviewSession: 'current' } },
  }), true);
  assert.equal(guardStudioStartup({ parent, name: 'website-workshop-preview:named', frameElement: null }), true);
  assert.deepEqual(messages.map(message => message.session), ['current', 'named']);
});

test('compiled document and live preview both use the protection', () => {
  const bundle = readFileSync(new URL('./website-workshop/assets/index-fkdtBi_i.js', import.meta.url), 'utf8');
  assert.equal(bundle.split('(${installPreviewHashNavigation.toString()})();').length, 2);
  assert.equal(bundle.split('writePreviewDocument(p.current,oe,F)').length, 2);
  const entry = readFileSync(new URL('./website-workshop/index.html', import.meta.url), 'utf8');
  assert.match(entry, /src="\/website-workshop\/studio-bootstrap.js"/);
  assert.doesNotMatch(entry, /src="[^"]*index-fkdtBi_i.js"/);
});

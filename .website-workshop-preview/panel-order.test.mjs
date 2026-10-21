import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ORDER, validOrder, movePanel } from './website-workshop/panel-order.js';

test('move each panel to every available slot without dropping or duplicating cards', () => {
  for (const id of DEFAULT_ORDER) {
    for (let slot = 0; slot < 4; slot++) {
      const result = movePanel(DEFAULT_ORDER, id, slot);
      assert.equal(result[slot], id);
      assert.ok(validOrder(result));
      assert.deepEqual(result.filter(value => value !== id), DEFAULT_ORDER.filter(value => value !== id));
    }
  }
  assert.deepEqual(DEFAULT_ORDER, ['learn', 'create', 'code', 'preview']);
});

test('keyboard moves stop at the first and last slots', () => {
  assert.deepEqual(movePanel(DEFAULT_ORDER, 'learn', -1), DEFAULT_ORDER);
  assert.deepEqual(movePanel(DEFAULT_ORDER, 'preview', 4), DEFAULT_ORDER);
});

test('accept only complete valid saved layouts', () => {
  for (const bad of [null, {}, [], ['learn', 'create', 'code'], ['learn', 'learn', 'code', 'preview'],
    ['learn', 'create', 'code', 'unknown']]) assert.equal(validOrder(bad), false);
  assert.ok(validOrder(['preview', 'code', 'learn', 'create']));
});

'use strict';

const assert = require('assert');
const { normalizeWindowBounds } = require('./windowBounds');

assert.deepStrictEqual(
  normalizeWindowBounds({ offsetX: -100, offsetY: '200', width: 800, height: '600' }),
  { offsetX: -100, offsetY: 200, width: 800, height: 600 }
);
assert.throws(() => normalizeWindowBounds({ offsetX: 0, offsetY: 0, width: 99, height: 600 }), /width must be between/);
assert.throws(() => normalizeWindowBounds({ offsetX: 0, offsetY: 0, width: 800, height: 10001 }), /height must be between/);
assert.throws(() => normalizeWindowBounds({ offsetX: 0, offsetY: 0, width: 800.5, height: 600 }), /width must be an integer/);
assert.throws(() => normalizeWindowBounds({ offsetX: 100001, offsetY: 0, width: 800, height: 600 }), /offsetX is out of range/);
assert.throws(() => normalizeWindowBounds({ offsetX: '', offsetY: 0, width: 800, height: 600 }), /offsetX is required/);

console.log('windowBounds.test.js OK');

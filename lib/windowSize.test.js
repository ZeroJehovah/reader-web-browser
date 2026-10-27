'use strict';

const assert = require('assert');
const { normalizeWindowSize } = require('./windowSize');

assert.deepStrictEqual(normalizeWindowSize(800, '600'), { width: 800, height: 600 });
assert.deepStrictEqual(normalizeWindowSize('100', 10000), { width: 100, height: 10000 });
assert.throws(() => normalizeWindowSize(99, 600), /width must be an integer/);
assert.throws(() => normalizeWindowSize(800, 10001), /height must be an integer/);
assert.throws(() => normalizeWindowSize(800.5, 600), /width must be an integer/);
assert.throws(() => normalizeWindowSize('', 600), /width and height are required/);

console.log('windowSize.test.js OK');

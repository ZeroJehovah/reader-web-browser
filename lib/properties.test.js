'use strict';

const assert = require('assert');
const { parseProperties } = require('./properties');

const sample = [
  '# comment',
  '! another comment',
  '',
  'url=http://172.31.240.155:1122/vue/index.html#/',
  'width=400',
  '  height=400  ',
  'offsetX=2119',
  'offsetY=803'
].join('\n');

const props = parseProperties(sample);
assert.strictEqual(props.url, 'http://172.31.240.155:1122/vue/index.html#/');
assert.strictEqual(props.width, '400');
assert.strictEqual(props.height, '400');
assert.strictEqual(props.offsetX, '2119');
assert.strictEqual(props.offsetY, '803');

// Java Properties 语义补充：续行、转义、冒号分隔与空白 key=value。
const advanced = parseProperties([
  'a=one\\',
  '  two',
  'b\\tc = spaced  value ',
  'c:colon:value',
  'd=tab\\there'
].join('\n'));
assert.strictEqual(advanced.a, 'one two');
assert.strictEqual(advanced['b\tc'], 'spaced  value');
assert.strictEqual(advanced.c, 'colon:value');
assert.strictEqual(advanced.d, 'tab\there');
console.log('properties.test.js OK');

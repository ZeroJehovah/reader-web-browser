'use strict';

const assert = require('assert');
const { parseProperties, updateProperties } = require('./properties');

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

// 更新窗口配置时保留注释、未知键、分隔符与 CRLF。
const windowConfig = [
  '# window geometry',
  'url=http://localhost/#/home',
  'width = 400',
  'height:400',
  'offsetX=2119',
  'offsetY=803',
  'unrelated=keep me',
  ''
].join('\r\n');
const updatedConfig = updateProperties(windowConfig, {
  width: 800,
  height: 600,
  offsetX: -20,
  offsetY: 40
});
const updated = parseProperties(updatedConfig);
assert.strictEqual(updated.width, '800');
assert.strictEqual(updated.height, '600');
assert.strictEqual(updated.offsetX, '-20');
assert.strictEqual(updated.offsetY, '40');
assert.strictEqual(updated.url, 'http://localhost/#/home');
assert.strictEqual(updated.unrelated, 'keep me');
assert.ok(updatedConfig.includes('# window geometry'));
assert.ok(updatedConfig.includes('width = 800'));
assert.ok(updatedConfig.includes('height:600'));
assert.ok(updatedConfig.includes('\r\n'));

// 缺失键追加；重复键全部更新，避免后出现的旧值覆盖新值。
const appended = updateProperties('width=400\nwidth=401', { width: 500, offsetX: 10 });
const appendedProps = parseProperties(appended);
assert.strictEqual(appendedProps.width, '500');
assert.strictEqual(appendedProps.offsetX, '10');

// 被更新的续行键合并成一行，不能残留续行内容。
const continued = updateProperties('width=400\\\n  500\nheight=300\n', { width: 640 });
const continuedProps = parseProperties(continued);
assert.strictEqual(continuedProps.width, '640');
assert.strictEqual(continuedProps.height, '300');
assert.ok(!continued.includes('500'));

// 其他键的续行即使长得像目标键，也不能被误改。
const continuedOther = updateProperties('note=one\\\n width=999\nwidth=400\n', { width: 500 });
const continuedOtherProps = parseProperties(continuedOther);
assert.strictEqual(continuedOtherProps.note, 'one width=999');
assert.strictEqual(continuedOtherProps.width, '500');

console.log('properties.test.js OK');

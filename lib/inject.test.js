'use strict';

const assert = require('assert');
const { escapeForJsString, formatLikeJava } = require('./inject');

assert.strictEqual(escapeForJsString("content: '';"), "content: \\'\\';");
assert.strictEqual(escapeForJsString('a\n  b\n\tc'), 'a b c');

const template = "var style = document.createElement('style');\nstyle.innerHTML = '%s';\n";
const out = formatLikeJava(template, escapeForJsString("body::before{content: '';}"));
assert.ok(out.includes("style.innerHTML = 'body::before{content: \\'\\';}';"));
assert.strictEqual(formatLikeJava('a%%b%s', 'X'), 'a%bX');
console.log('inject.test.js OK');

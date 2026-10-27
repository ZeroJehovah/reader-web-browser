'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const { parseProperties } = require('./properties');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-web-browser-'));
const bundledDir = path.join(tempDir, 'app-resources');
const bundledConfigPath = path.join(bundledDir, 'config.properties');
const externalConfigPath = path.join(tempDir, 'config.properties');
const bundledConfig = [
  '# bundled default',
  'url=http://localhost/#/home',
  'width=400',
  'height=400',
  'offsetX=0',
  'offsetY=0',
  ''
].join('\n');

fs.mkdirSync(bundledDir);
fs.writeFileSync(bundledConfigPath, bundledConfig, 'utf8');

// config.js -> resources.js 只依赖 Electron app 的路径信息，测试时注入最小替身。
const originalLoad = Module._load;
Module._load = function loadWithElectronStub(request, parent, isMain) {
  if (request === 'electron') {
    return { app: { isPackaged: false, getAppPath: () => tempDir } };
  }
  return originalLoad.call(this, request, parent, isMain);
};

try {
  const { saveWindowBounds } = require('./config');

  const target = saveWindowBounds({ x: -20, y: 40, width: 800, height: 600 });
  assert.strictEqual(target, externalConfigPath);
  assert.strictEqual(fs.readFileSync(bundledConfigPath, 'utf8'), bundledConfig);

  const firstSave = parseProperties(fs.readFileSync(externalConfigPath, 'utf8'));
  assert.strictEqual(firstSave.url, 'http://localhost/#/home');
  assert.strictEqual(firstSave.width, '800');
  assert.strictEqual(firstSave.height, '600');
  assert.strictEqual(firstSave.offsetX, '-20');
  assert.strictEqual(firstSave.offsetY, '40');

  fs.writeFileSync(externalConfigPath, [
    '# user config',
    'url=http://localhost/#/home',
    'width=800',
    'height=600',
    'offsetX=-20',
    'offsetY=40',
    'theme=dark',
    ''
  ].join('\n'), 'utf8');
  saveWindowBounds({ x: 100, y: 120, width: 1024, height: 768 });

  const secondText = fs.readFileSync(externalConfigPath, 'utf8');
  const secondSave = parseProperties(secondText);
  assert.strictEqual(secondSave.width, '1024');
  assert.strictEqual(secondSave.height, '768');
  assert.strictEqual(secondSave.offsetX, '100');
  assert.strictEqual(secondSave.offsetY, '120');
  assert.strictEqual(secondSave.theme, 'dark');
  assert.ok(secondText.includes('# user config'));
  assert.deepStrictEqual(
    fs.readdirSync(tempDir).filter((name) => name.endsWith('.tmp')),
    []
  );
} finally {
  Module._load = originalLoad;
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('config.test.js OK');

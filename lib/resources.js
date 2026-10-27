'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const APP_RESOURCES = 'app-resources';

function externalBaseDir() {
  if (app.isPackaged) {
    // electron-builder 的 portable 包会解压到临时目录运行，原 exe 所在目录
    // 由该环境变量提供；其余打包形态仍以 exe 所在目录为准。
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
      return process.env.PORTABLE_EXECUTABLE_DIR;
    }
    // 与 Java 版 FileUtil.PARENT_DIR 语义一致：可执行文件所在目录。
    return path.dirname(process.execPath);
  }
  // 开发态没有“jar 同目录”概念，等价于仓库根目录（package.json 所在目录）。
  return app.getAppPath();
}

function bundledBaseDir() {
  // asarUnpack 后资源实际位于 app.asar.unpacked；开发态仍使用仓库目录。
  const asarPath = path.join(app.getAppPath(), APP_RESOURCES);
  if (!app.isPackaged) return asarPath;
  return asarPath.replace(/([\\/])app\.asar([\\/]|$)/, '$1app.asar.unpacked$2');
}

function resolveResource(relPath) {
  const externalPath = path.join(externalBaseDir(), relPath);
  let source = '外部文件';
  let resolved = externalPath;

  try {
    if (!fs.existsSync(externalPath) || !fs.statSync(externalPath).isFile()) {
      resolved = path.join(bundledBaseDir(), relPath);
      source = '内部文件';
    }
  } catch (err) {
    resolved = path.join(bundledBaseDir(), relPath);
    source = '内部文件';
  }

  // Java 版会打印这两行，保留相同输出便于对照排查。
  process.stdout.write('读取文件: ' + relPath + ', 使用' + source + ': ' + resolved + '\n');
  return resolved;
}

// 可写配置始终放在外部资源目录，避免修改 asar 内的默认配置。
function externalResourcePath(relPath) {
  return path.join(externalBaseDir(), relPath);
}

function readResource(relPath) {
  return fs.readFileSync(resolveResource(relPath), 'utf8');
}

function readResourceOrEmpty(relPath) {
  try {
    return readResource(relPath);
  } catch (err) {
    return '';
  }
}

function readResourceBuffer(relPath) {
  return fs.readFileSync(resolveResource(relPath));
}

module.exports = {
  resolveResource,
  externalResourcePath,
  readResource,
  readResourceOrEmpty,
  readResourceBuffer
};

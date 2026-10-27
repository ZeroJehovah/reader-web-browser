'use strict';

const fs = require('fs');
const { externalResourcePath, readResourceOrEmpty } = require('./resources');
const { parseProperties, updateProperties } = require('./properties');

const CONFIG_FILE = 'config.properties';

function readConfig() {
  const props = parseProperties(readResourceOrEmpty(CONFIG_FILE));
  const url = props.url;
  const width = Number.parseInt(props.width, 10);
  const height = Number.parseInt(props.height, 10);
  const offsetX = Number.parseInt(props.offsetX, 10);
  const offsetY = Number.parseInt(props.offsetY, 10);

  const missing = [
    !url && 'url',
    Number.isNaN(width) && 'width',
    Number.isNaN(height) && 'height',
    Number.isNaN(offsetX) && 'offsetX',
    Number.isNaN(offsetY) && 'offsetY'
  ].filter(Boolean);

  if (missing.length) {
    throw new Error('config.properties 缺少或存在非法配置项: ' + missing.join(', '));
  }

  const config = { url, width, height, offsetX, offsetY };
  // Java 版 Config.read() 的输出格式保持一致，便于日志对照。
  for (const key of Object.keys(config)) {
    process.stdout.write(key + ': ' + config[key] + '\n');
  }
  return config;
}

function normalizeBounds(bounds) {
  const width = Math.round(bounds.width);
  const height = Math.round(bounds.height);
  const offsetX = Math.round(bounds.x);
  const offsetY = Math.round(bounds.y);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('窗口宽高非法: ' + width + 'x' + height);
  }
  if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) {
    throw new Error('窗口坐标非法: ' + offsetX + ',' + offsetY);
  }

  return { width, height, offsetX, offsetY };
}

function writeFileAtomically(filePath, content) {
  const tempPath = filePath + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    try {
      fs.unlinkSync(tempPath);
    } catch (_) {
      // 临时文件可能尚未创建，或已被 rename 消费。
    }
    throw err;
  }
}

function saveWindowBounds(bounds) {
  const values = normalizeBounds(bounds);
  const targetPath = externalResourcePath(CONFIG_FILE);
  let source;

  try {
    source = fs.readFileSync(targetPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    // 首次修改时以打包内的默认配置为模板，在外部目录生成可写配置。
    source = readResourceOrEmpty(CONFIG_FILE);
  }

  const content = updateProperties(source, values);
  writeFileAtomically(targetPath, content);
  process.stdout.write('保存窗口配置: ' + targetPath + '\n');
  return targetPath;
}

module.exports = { readConfig, saveWindowBounds, normalizeBounds };

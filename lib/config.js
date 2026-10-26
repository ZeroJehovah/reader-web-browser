'use strict';

const { readResourceOrEmpty } = require('./resources');
const { parseProperties } = require('./properties');

function readConfig() {
  const props = parseProperties(readResourceOrEmpty('config.properties'));
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

module.exports = { readConfig };

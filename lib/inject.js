'use strict';

function escapeForJsString(css) {
  // 对齐 Java 版 Javascript.injectCss() 的行为：
  //   css.replaceAll("'", "\\\\'")
  //   css.replaceAll("\\s+", " ")
  return css.replace(/'/g, "\\'").replace(/\s+/g, ' ');
}

// Java 用 String.format(injectCss, css) 注入，这里保持同样的 %s 语义。
function formatLikeJava(template, value) {
  let out = '';
  let argIndex = 0;
  for (let i = 0; i < template.length; i += 1) {
    const ch = template[i];
    if (ch === '%' && i + 1 < template.length) {
      const next = template[i + 1];
      if (next === 's') {
        out += argIndex === 0 ? value : '';
        argIndex += 1;
        i += 1;
        continue;
      }
      if (next === '%') {
        out += '%';
        i += 1;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

function injectCss() {
  try {
    // 延迟加载：避免纯函数测试（node lib/inject.test.js）被迫拉起 Electron。
    const { readResourceOrEmpty } = require('./resources');
    const template = readResourceOrEmpty('js/injectCss.js');
    const css = readResourceOrEmpty('css/style.css');
    return formatLikeJava(template, escapeForJsString(css));
  } catch (err) {
    return '';
  }
}

module.exports = { injectCss, escapeForJsString, formatLikeJava };

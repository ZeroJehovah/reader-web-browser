'use strict';

const WHITESPACE = /[ \t\f]/;

function countTrailingBackslashes(value) {
  let count = 0;
  for (let i = value.length - 1; i >= 0 && value[i] === '\\'; i -= 1) count += 1;
  return count;
}

function unescapeJava(value) {
  let out = '';
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] !== '\\') {
      out += value[i];
      continue;
    }

    i += 1;
    if (i >= value.length) {
      out += '\\';
      break;
    }

    const ch = value[i];
    switch (ch) {
      case 't': out += '\t'; break;
      case 'n': out += '\n'; break;
      case 'r': out += '\r'; break;
      case 'f': out += '\f'; break;
      case 'u': {
        const hex = value.slice(i + 1, i + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
          throw new Error('config.properties 中存在非法的 Unicode 转义');
        }
        out += String.fromCharCode(Number.parseInt(hex, 16));
        i += 4;
        break;
      }
      default:
        // Java Properties 对未知转义会丢弃反斜杠，保留后面的字符。
        out += ch;
    }
  }
  return out;
}

function logicalLines(text) {
  const lines = [];
  let current = '';
  let continuing = false;

  for (const rawLine of text.split(/\r\n|\r|\n/)) {
    let line = continuing ? rawLine.replace(/^[ \t\f]+/, '') : rawLine;
    if (continuing) line = ' ' + line; // Java 续行用单个空格分隔。
    current += line;

    if (countTrailingBackslashes(current) % 2 === 1) {
      current = current.slice(0, -1);
      continuing = true;
    } else {
      lines.push(current);
      current = '';
      continuing = false;
    }
  }

  if (continuing || current) lines.push(current);
  return lines;
}

// Java java.util.Properties.load() 的核心语义：注释、续行、分隔符和转义。
function parseProperties(text) {
  const props = {};

  for (const rawLine of logicalLines(text)) {
    const line = rawLine.replace(/^[ \t\f]+/, '');
    if (!line || line[0] === '#' || line[0] === '!') continue;

    let keyEnd = -1;
    let valueStart = -1;
    let escaped = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      // 先检查空白再检查转义：Java Properties 的 key 遇到空白即结束，
      // 空白后的 "=" 属于 value；仅 "\\=" 这类显式转义才进入 key。
      if (WHITESPACE.test(ch)) {
        keyEnd = i;
        valueStart = i;
        break;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '=' || ch === ':') {
        keyEnd = i;
        valueStart = i + 1;
        break;
      }
    }

    if (keyEnd === -1) {
      keyEnd = line.length;
      valueStart = line.length;
    } else {
      while (valueStart < line.length && WHITESPACE.test(line[valueStart])) valueStart += 1;
      if (line[valueStart] === '=' || line[valueStart] === ':') valueStart += 1;
      while (valueStart < line.length && WHITESPACE.test(line[valueStart])) valueStart += 1;
    }

    // Java 规则：key 内部空格保留，两端空格由上面的分隔逻辑切掉。
    const key = unescapeJava(line.slice(0, keyEnd));
    if (!key) continue;
    props[key] = unescapeJava(line.slice(valueStart)).trim();
  }

  return props;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 只改写目标键，保留注释、未知配置项、分隔符和原有换行符。
function updateProperties(text, updates) {
  const source = text || '';
  const newline = (source.match(/\r\n|\n|\r/) || ['\n'])[0];
  const hasTrailingNewline = /(?:\r\n|\n|\r)$/.test(source);
  const body = hasTrailingNewline
    ? source.replace(/(?:\r\n|\n|\r)$/, '')
    : source;
  const lines = body ? body.split(/\r\n|\n|\r/) : [];
  const pending = new Set(Object.keys(updates));
  const keyPatterns = [...pending].map((key) => ({
    key,
    pattern: new RegExp(
      '^([ \\t\\f]*)(' + escapeRegExp(key) + ')([ \\t\\f]*[=:][ \\t\\f]*|[ \\t\\f]+)(.*)$'
    )
  }));
  const output = [];
  let continuing = false;
  let discardContinuation = false;

  for (const line of lines) {
    if (continuing) {
      if (!discardContinuation) output.push(line);
      continuing = countTrailingBackslashes(line) % 2 === 1;
      if (!continuing) discardContinuation = false;
      continue;
    }

    if (/^[ \t\f]*(?:#|!)/.test(line)) {
      output.push(line);
      continue;
    }

    const matched = keyPatterns.find(({ pattern }) => pattern.test(line));
    if (!matched) {
      output.push(line);
      continuing = countTrailingBackslashes(line) % 2 === 1;
      continue;
    }

    const parts = line.match(matched.pattern);
    output.push(parts[1] + matched.key + parts[3] + String(updates[matched.key]));
    pending.delete(matched.key);

    // 被改写的逻辑行不再需要原有的续行内容；直接合并为一行。
    continuing = countTrailingBackslashes(line) % 2 === 1;
    discardContinuation = continuing;
  }

  for (const key of keyPatterns) {
    if (pending.has(key.key)) output.push(key.key + '=' + String(updates[key.key]));
  }

  if (!output.length) return '';
  return output.join(newline) + (hasTrailingNewline || !source ? newline : '');
}

module.exports = { parseProperties, unescapeJava, updateProperties };

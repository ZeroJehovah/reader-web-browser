'use strict';

const MIN_WINDOW_SIZE = 100;
const MAX_WINDOW_SIZE = 10000;

function normalizeWindowSize(width, height) {
  const values = { width, height };
  for (const [name, value] of Object.entries(values)) {
    if (value === '' || value === null || value === undefined) {
      throw new Error('width and height are required');
    }
    const number = Number(value);
    if (!Number.isInteger(number) || number < MIN_WINDOW_SIZE || number > MAX_WINDOW_SIZE) {
      throw new Error(`${name} must be an integer between ${MIN_WINDOW_SIZE} and ${MAX_WINDOW_SIZE}`);
    }
    values[name] = number;
  }
  return values;
}

module.exports = { normalizeWindowSize, MIN_WINDOW_SIZE, MAX_WINDOW_SIZE };

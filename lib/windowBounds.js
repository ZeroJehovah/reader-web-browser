'use strict';

const MIN_WINDOW_SIZE = 100;
const MAX_WINDOW_SIZE = 10000;
const MAX_WINDOW_POSITION = 100000;

function normalizeWindowBounds(bounds) {
  const values = {
    offsetX: bounds.offsetX,
    offsetY: bounds.offsetY,
    width: bounds.width,
    height: bounds.height
  };

  for (const [name, value] of Object.entries(values)) {
    if (value === '' || value === null || value === undefined) {
      throw new Error(`${name} is required`);
    }
    const number = Number(value);
    if (!Number.isInteger(number)) {
      throw new Error(`${name} must be an integer`);
    }
    values[name] = number;
  }

  for (const name of ['width', 'height']) {
    if (values[name] < MIN_WINDOW_SIZE || values[name] > MAX_WINDOW_SIZE) {
      throw new Error(`${name} must be between ${MIN_WINDOW_SIZE} and ${MAX_WINDOW_SIZE}`);
    }
  }

  for (const name of ['offsetX', 'offsetY']) {
    if (Math.abs(values[name]) > MAX_WINDOW_POSITION) {
      throw new Error(`${name} is out of range`);
    }
  }

  return values;
}

module.exports = { normalizeWindowBounds, MIN_WINDOW_SIZE, MAX_WINDOW_SIZE, MAX_WINDOW_POSITION };

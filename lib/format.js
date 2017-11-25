'use strict';

const util = require('util');
const get = require('get-value');
const codes = require('./codes');

/**
 * Create a formatted error message from the given error
 * `type`, error `code` and `..args`.
 *
 * @param {String} `type` Error type (PARSER, LEXER, etc)
 * @param {String} `code` Error code
 * @param {...any} `...args`
 * @return {String}
 * @api public
 */

function format(type, code, ...args) {
  const obj = codes[type];
  if (typeof obj === 'undefined') {
    throw new Error(`error codes ${type} does not exist`);
  }
  const opts = obj[code];
  if (typeof opts === 'undefined') {
    throw new Error(`error code ${code} does not exist`);
  }
  return util.format(opts.message, ...args);
}

/**
 * Show the position where the parser or lexer crashed.
 *
 * @param {Object} `self` parser or lexer instance
 * @param {Object} `token`
 * @return {String}
 * @api public
 */

format.showPosition = function(self, tok) {
  let input = self.consumed.replace(/\n/g, '\\n');
  let val = tok.val;
  let len = val ? val.length : 0;

  if (input.length > 20) {
    input = input.slice(-20);
  }

  let idx = input.length - len + 1;
  let dashes = new Array(idx).join('-') + '^';
  let position = input + '\n' + dashes;

  const line = get(tok, 'position.start.line');
  const column = get(tok, 'position.start.column');
  if (typeof line === 'number' && typeof column === 'number') {
    var pos = '\n\n' + position + '\n';
    return util.format('<line:%s column:%s>', line, column, pos);
  }

  return position;
};

/**
 * Expose `format`
 */

module.exports = format;

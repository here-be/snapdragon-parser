'use strict';

const format = require('./format');

/**
 * Create a new `LexerError` with the given error `code`.
 * See https://github.com/v8/v8/wiki/Stack-Trace-API
 *
 * @param {String} `code`
 * @param {String} `message`
 */

function LexerError(code, ...rest) {
  this.name = 'LexerError';
  this.code = code;
  this.message = format('LEXER', code, ...rest);
  Error.captureStackTrace(this, LexerError);
}

/**
 * Inherit `Error`
 */

LexerError.prototype.__proto__ = Error.prototype;

/**
 * Expose LexerError
 */

module.exports = LexerError;

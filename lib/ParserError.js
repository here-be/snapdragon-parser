'use strict';

const format = require('./format');

/**
 * Create a new `ParserError` with the given error `code`.
 * See https://github.com/v8/v8/wiki/Stack-Trace-API
 *
 * @param {String} `code`
 * @param {String} `message`
 */

function ParserError(code, ...rest) {
  this.name = 'ParserError';
  this.code = code;
  this.message = format('PARSER', code, ...rest);
  Error.captureStackTrace(this, ParserError);
}

/**
 * Inherit `Error`
 */

ParserError.prototype.__proto__ = Error.prototype;

/**
 * Expose ParserError
 */

module.exports = ParserError;

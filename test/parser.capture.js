'use strict';

require('mocha');
var assert = require('assert');
var Lexer = require('snapdragon-lexer');
var Parser = require('..');
var parser;
var lexer;

describe('parser.capture', function() {
  beforeEach(function() {
    parser = new Parser();
  });

  it('should throw when invalid args are passed to parse', function() {
    assert.throws(function() {
      parser.parse();
    });
  });

  it('should capture the given regex', function() {
    parser.capture('slash', /^\//, function(tok) {
      return this.node(tok);
    });

    parser.capture('text', /^\w+/, function(tok) {
      return this.node(tok);
    });

    parser.parse('a/b');
    assert.equal(parser.string, 'a/b');
  });
});

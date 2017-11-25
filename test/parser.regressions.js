'use strict';

require('mocha');
var assert = require('assert');
var Lexer = require('snapdragon-lexer');
var Parser = require('..');
var parser;
var lexer;

describe('parser.regressions', function() {
  beforeEach(function() {
    lexer = new Lexer();
    parser = new Parser(lexer);
  });

  describe('constructor:', function() {
    it('should return an instance of Parser:', function() {
      assert(parser instanceof Parser);
    });
  });

  // ensures that we catch and document API changes
  describe('prototype methods:', function() {
    var methods = [
      'error',
      'set',
      'parse',
      'capture',
      'use'
    ];

    methods.forEach(function(method) {
      it('should expose .' + method + '', function() {
        assert.equal(typeof parser[method], 'function');
      });
    });
  });
});

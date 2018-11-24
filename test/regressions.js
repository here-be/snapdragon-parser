'use strict';

require('mocha');
const assert = require('assert');
const Lexer = require('snapdragon-lexer');
const Parser = require('..');
let parser;
let lexer;

describe('regressions', function() {
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
    let methods = [
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

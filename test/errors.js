'use strict';

require('mocha');
var assert = require('assert');
var typeOf = require('kind-of');
var ParserError = require('../lib/ParserError');
var Parser = require('..');
var parser;

function throws(fn, val, msg) {
  try {
    fn();
    assert(false, msg);
  } catch (err) {
    switch(typeOf(val)) {
      case 'error':
        break;
      case 'function':
        assert(val(err), msg);
        break;
      case 'regexp':
        assert(val.test(err.message), msg);
        break;
      case 'string':
        assert(err.message === val, msg);
        break;
      default: {
        assert(false, 'invalid assertion');
      }
    }
  }
}

describe('parser errors', function() {
  beforeEach(function() {
    parser = new Parser();
  });

  describe('parser.get', function() {
    it('should throw an error when a handler is not registered', function() {
      assert.throws(() => parser.get('foo'), /expected handler "foo" to be a function/);
    });
  });

  describe('parser.parse', function() {
    it('should throw an error when no handler is registered for the given string', function() {
      assert.throws(() => parser.parse('foo'), /unmatched input: "foo"/);
    });
  });

  describe('parser.push', function() {
    it('should not throw when node.push is used', function() {
      const node = parser.node({type: 'brace'});
      const open = parser.node({type: 'brace.open'});
      node.push(open);

      assert.doesNotThrow(function() {
        parser.push(node);
      });
    });
  });
});

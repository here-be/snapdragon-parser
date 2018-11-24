'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.isInside()', function() {
  beforeEach(function() {
    parser = new Parser();
  });

  it('should return false when node is not a block', function() {
    assert(!parser.isBlock(parser.node({ type: 'foo' })));
  });

  it('should return true when node is a block node', function() {
    assert(parser.isBlock(parser.node({ type: 'foo', nodes: [] })));
  });
});

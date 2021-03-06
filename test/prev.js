'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.prev()', function() {
  beforeEach(function() {
    parser = new Parser('a/b');
  });

  it('should get the root node by default', function() {
    assert.equal(parser.prev().type, 'root');
  });

  it('should get the prev node from the stack', function() {
    parser.push(parser.node({type: 'brace', nodes: [parser.node('brace.open', '{')]}));
    assert.equal(parser.prev().type, 'brace');
  });
});

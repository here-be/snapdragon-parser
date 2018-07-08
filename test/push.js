'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.push()', function() {
  beforeEach(function() {
    parser = new Parser()
      .capture('slash', /^\//)
      .capture('text', /^[\w,]+/)
      .capture('brace.close', /^}/)
      .capture('brace.open', /^{/, function(open) {
        return this.node({type: 'brace', nodes: [open]});
      })
      .capture('bracket.close', /^\]/)
      .capture('bracket.open', /^\[/, function(open) {
        return this.node({type: 'bracket', nodes: [open]});
      });
  });

  it('should do nothing when the value is undefined', function() {
    assert.doesNotThrow(function() {
      parser.push();
    });
  });

  it('should create a block when an a node with a .nodes array is returned', function() {
    parser.parse('{/,b}');

    assert.equal(parser.ast.nodes[1].type, 'brace');
    assert(Array.isArray(parser.ast.nodes[1].nodes));
    assert.equal(parser.ast.nodes[1].nodes[0].type, 'brace.open');
    assert.equal(parser.ast.nodes[1].nodes[1].type, 'slash');
    assert.equal(parser.ast.nodes[1].nodes[2].type, 'text');
    assert.equal(parser.ast.nodes[1].nodes[3].type, 'brace.close');
  });

  it('should throw an error when the closing node is missing', function() {
    assert.throws(() => parser.parse('[{/,b]'), /brace/);
  });
});

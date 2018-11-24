'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.accept()', function() {
  beforeEach(function() {
    parser = new Parser();
    parser.capture('brace.close', /^}/);
    parser.capture('slash', /^\//);
    parser.capture('text', /^[\w,]+/);
  });

  it('should accept the next node when it matches the given type', function() {
    parser.capture('brace.open', /^{/, function(open) {
      const node = parser.node({type: 'brace', nodes: [open]});
      node.push(this.accept('slash'));
      node.push(this.accept('text'));
      return node;
    });

    assert.doesNotThrow(() => parser.parse('{/,b}'));
    assert.equal(parser.ast.nodes[1].nodes[1].type, 'slash');
    assert.equal(parser.ast.nodes[1].nodes[2].type, 'text');
  });

  it('should not accept the next node when it does not match the given type', function() {
    parser.capture('brace.open', /^{/, function(open) {
      const node = parser.node({type: 'brace', nodes: [open]});
      node.push(this.accept('foo'));
      node.push(this.accept('bar'));
      return node;
    });

    assert.doesNotThrow(() => parser.parse('{/,b}'));
    assert.notEqual(parser.ast.nodes[1].nodes[1].type, 'foo');
    assert.notEqual(parser.ast.nodes[1].nodes[2].type, 'bar');
  });
});

'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.expect()', function() {
  beforeEach(function() {
    parser = new Parser();
    parser.capture('brace.close', /^}/);
  });

  it('should throw an error when the next node is not expected', function() {
    parser.capture('slash', /^\//);
    parser.capture('text', /^\w+/);
    parser.capture('brace.open', /^{/, function(open) {
      const node = parser.node({type: 'brace', nodes: [open]});
      node.push(this.expect('text'));
      return node;
    });

    assert.throws(() => parser.parse('{/,b}'), /text/);
  });

  it('should not throw an error when the next node is expected', function() {
    parser.capture('slash', /^\//);
    parser.capture('text', /^[\w,]+/);
    parser.capture('brace.open', /^{/, function(open) {
      const node = parser.node({type: 'brace', nodes: [open]});
      node.push(this.expect('slash'));
      return node;
    });

    assert.doesNotThrow(() => parser.parse('{/,b}'), /text/);
  });
});

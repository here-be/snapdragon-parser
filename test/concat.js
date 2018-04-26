'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.concat()', function() {
  beforeEach(function() {
    parser = new Parser('a/b');
  });

  it('should add the nodes from one ast to another', function() {
    parser.capture('slash', /^\//);
    parser.capture('text', /^\w+/);

    const p2 = parser.create();
    const ast = p2.parse('x/y');
    parser.concat(parser.ast, ast);

    assert.equal(parser.ast.nodes.length, 3);
  });
});

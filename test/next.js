'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.next()', function() {
  beforeEach(function() {
    parser = new Parser('a/b');
  });

  it('should get the next node', function() {
    parser.capture('slash', /^\//);
    parser.capture('text', /^\w+/);

    assert.equal(parser.next().value, 'a');
    assert.equal(parser.next().value, '/');
    assert.equal(parser.next().value, 'b');
  });
});

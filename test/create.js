'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.create()', function() {
  beforeEach(function() {
    parser = new Parser('a/b');
  });

  it('should create a new instance while keeping parser.handlers', function() {
    parser.capture('slash', /^\//);
    parser.capture('text', /^\w+/);

    const newParser = parser.create();

    assert(newParser instanceof Parser);
    assert(newParser !== parser);
    assert(newParser.handlers === parser.handlers);
  });
});

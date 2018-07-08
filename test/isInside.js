'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.isInside()', function() {
  beforeEach(function() {
    parser = new Parser();
  });

  it('should return true when inside a block', function() {
    assert(!parser.isInside('brace'));
    parser.push({type: 'brace', nodes: [{type: 'brace.open'}]});
    assert(parser.isInside('brace'));
    parser.push({type: 'bracket', nodes: [{type: 'bracket.open'}]});
    assert(parser.isInside('bracket'));
    assert(parser.isInside('brace'));
    parser.push({type: 'bracket.close'});
    assert(!parser.isInside('bracket'));
    parser.push({type: 'brace.close'});
    assert(!parser.isInside('brace'));
  });
});

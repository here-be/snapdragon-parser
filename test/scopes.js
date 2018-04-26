'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe.skip('parser.scopes', function() {
  beforeEach(function() {
    parser = new Parser();
    parser.on('node', function(node) {
      Reflect.defineProperty(node, 'match', { value: node.match, enumerable: false });
    });
  });

  it('should parse brackets', function() {
    parser
      .capture('text', /^[^{}]+/)
      .capture('brace.close', /^\}/)
      .capture('brace.open', /^\{/, function(tok) {
        return { type: 'brace', isScope: true, nodes: [tok] };
      });

    parser.parse('{a,b}');
    assert.deepEqual(parser.ast, {
      type: 'root',
      nodes: [
        {
          type: 'bos',
          value: ''
        },
        {
          type: 'brace',
          isScope: true,
          nodes: [
            {
              type: 'brace.open',
              value: '{'
            },
            {
              type: 'text',
              value: 'a,b'
            },
            {
              type: 'brace.close',
              value: '}'
            }
          ]
        },
        {
          type: 'eos',
          value: ''
        }
      ]
    });
  });
});

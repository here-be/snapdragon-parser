'use strict';

require('mocha');
var assert = require('assert');
var Lexer = require('snapdragon-lexer');
var Parser = require('..');
var parser;
var lexer;

describe.skip('parser.scopes', function() {
  beforeEach(function() {
    lexer = new Lexer();
    parser = new Parser(lexer);
  });

  it('should parse brackets', function() {
    parser.lexer
      .capture('brace.open', /^\{/)
      .capture('text', /^[^{}]+/)
      .capture('brace.close', /^\}/);

    parser
      .set('text', (tok) => parser.node(tok))
      .set('brace.close', (tok) => parser.node(tok))
      .set('brace.open', function(tok) {
        var node = this.node({type: 'brace', isScope: true, nodes: [] });
        node.push(this.node(tok));
        return node;
      });

    parser.on('node', function(node) {
      console.log(node.scope);
    });

    parser.parse('{a,b}');
    assert.deepEqual(parser.ast, {
      type: 'root',
      nodes: [
        {
          type: 'bos'
        },
        {
          type: 'brace',
          nodes: [
            {
              type: 'brace.open',
              val: '{',
              position: {
                start: {
                  line: 1,
                  column: 1
                },
                end: {
                  line: 1,
                  column: 2
                }
              }
            },
            {
              type: 'text',
              val: 'a,b',
              position: {
                start: {
                  line: 1,
                  column: 2
                },
                end: {
                  line: 1,
                  column: 5
                }
              }
            },
            {
              type: 'brace.close',
              val: '}',
              position: {
                start: {
                  line: 1,
                  column: 5
                },
                end: {
                  line: 1,
                  column: 6
                }
              }
            }
          ]
        },
        {
          type: 'eos'
        }
      ]
    });
  });
});

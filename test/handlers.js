'use strict';

require('mocha');
var assert = require('assert');
var Lexer = require('snapdragon-lexer');
var Parser = require('..');
var parser;
var lexer;

describe('parser handlers', function() {
  beforeEach(function() {
    lexer = new Lexer();
    parser = new Parser({lexer: lexer});
  });

  describe('handlers', function() {
    it('should expose a parser.handlers object', function() {
      assert(parser.handlers);
      assert.equal(typeof parser.handlers, 'object');
    });
  });

  describe('.set:', function() {
    it('should register named handler on parser.handlers', function() {
      parser.set('foo', function() {});
      parser.set('bar', function() {});

      assert.equal(typeof parser.handlers.get('foo'), 'function');
      assert.equal(typeof parser.handlers.get('bar'), 'function');
    });

    it('should be chainable:', function() {
      parser
        .set('text', function() {})
        .set('slash', function() {})
        .set('dot', function() {})

      assert.strictEqual(parser.handlers.size, 3);
    });

    it('should expose named parsers to handler:', function() {
      var count = 0;
      lexer.capture('slash', /^\//);
      lexer.capture('word', /^[a-z]/i);

      parser.set('default', function(tok) {
        count++;
        return this.node(tok);
      });

      parser.set('word', function(tok) {
        count++;
        return this.node(tok);
      });

      parser.set('slash', function(tok) {
        count++;
        assert.equal(tok.type, 'slash');
        const fn = this.get('default');
        return fn(tok);
      });

      parser.parse('a/b');
      assert.equal(parser.ast.nodes.length, 5);
      assert.equal(count, 4);
    });
  });

  describe('brackets', function() {
    it.skip('should parse brackets', function() {
      parser.lexer
        .capture('brace.open', /^\{/)
        .capture('text', /^[^{}]+/)
        .capture('brace.close', /^\}/);

      parser
        .set('text', (tok) => parser.node(tok))
        .set('brace.close', (tok) => parser.node(tok))
        .set('brace.open', function(tok) {
          var node = this.node({type: 'brace', nodes: [] });
          node.push(this.node(tok));
          return node;
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
});

'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser handlers', function() {
  beforeEach(function() {
    parser = new Parser();
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
        .set('dot', function() {});

      assert.strictEqual(parser.handlers.size, 3);
    });

    it('should expose named parsers to handler:', function() {
      let count = 0;
      parser.lexer.capture('slash', /^\//);
      parser.lexer.capture('word', /^[a-z]/i);

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
    it('should parse brackets', function() {
      parser.on('node', function(node) {
        Reflect.defineProperty(node, 'match', { value: node.match, enumerable: false });
      });

      parser.lexer
        .capture('brace.open', /^\{/)
        .capture('text', /^[^{}]+/)
        .capture('brace.close', /^\}/);

      parser
        .set('text', (tok) => parser.node(tok))
        .set('brace.close', (tok) => parser.node(tok))
        .set('brace.open', function(tok) {
          const node = this.node({type: 'brace', nodes: [] });
          node.push(this.node(tok));
          return node;
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
});

'use strict';

require('mocha');
const assert = require('assert');
const Lexer = require('snapdragon-lexer');
const Parser = require('..');
let parser;
let lexer;

describe('parser.parse', function() {
  beforeEach(function() {
    lexer = new Lexer();
    parser = new Parser({lexer: lexer});
  });

  it('should throw when invalid args are passed to parse', function() {
    assert.throws(function() {
      parser.parse();
    }, /Expected/);
  });

  it('should add unparsed original string to parser.string', function() {
    parser.capture('all', /^.+/, function(tok) {
      return this.node(tok);
    });

    parser.parse('a/b');
    assert.equal(parser.string, 'a/b');
  });

  it('should add parsed input to `parser.parsed`', function() {
    parser.capture('all', /^.+/, function(tok) {
      return this.node(tok);
    });

    parser.parse('a/b');
    assert.equal(parser.string, 'a/b');
  });

  it('should update parser.input as input is parsed', function() {
    parser.capture('all', /^.+/, function(tok) {
      return this.node(tok);
    });

    parser.parse('a/b');
    assert.equal(parser.string, 'a/b');
    assert.equal(parser.input, '');
  });

  it('should throw an error when a closing delimiter is missing', function() {
    lexer
      .capture('brace.open', /^\{/)
      .capture('text', /^[^{}]+/)
      .capture('rbrace', /^\}/)

    parser
      .capture('text', (tok) => parser.node(tok))
      .capture('brace.open', function(tok) {
        var node = this.node({type: 'brace', nodes: []});
        // node.expects = function(n) {
        //   return n.type === 'rbrace'
        // };
        node.push(this.node(tok));
        return node;
      })
      .capture('rbrace', function(tok) {
        return parser.node(tok);
      })

    assert.throws(function() {
      parser.parse('{a,b}');
    }, /unclosed/);
  });

  it('should close when node.isClose matches a node', function() {
    lexer
      .capture('text', /^[^{}]+/)
      .capture('lbrace', /^\{/)
      .capture('rbrace', /^\}/);

    parser
      .capture('text')
      .capture('lbrace', function(tok) {
        return this.node({
          type: 'brace',
          isClose: node => node.type = 'rbrace',
          nodes: [tok]
        });
      })
      .capture('rbrace');

    assert.doesNotThrow(function() {
      parser.parse('{a,b}');
    });
  });
});

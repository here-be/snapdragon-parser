'use strict';

require('mocha');
const assert = require('assert');
const Parser = require('..');
let parser;

describe('parser.parse()', function() {
  beforeEach(function() {
    parser = new Parser();
  });

  it('should throw when invalid args are passed to parse', function() {
    assert.throws(() => parser.parse(), /expected/i);
  });

  it('should add unparsed original string to parser.input', function() {
    parser.capture('all', /^.+/, tok => parser.node(tok));

    parser.parse('a/b');
    assert.equal(parser.input, 'a/b');
  });

  it('should add parsed input to `parser.parsed`', function() {
    parser.capture('text', /^\w+/);
    parser.parse('a');
    assert.equal(parser.parsed, 'a');
  });

  it('should use default handler when specific one is not registered', function() {
    parser.lexer.capture('text', /^\w+/);
    parser.lexer.capture('slash', /^\//);
    parser.capture('default', tok => parser.node(tok));

    parser.parse('a/b');
    assert.equal(parser.parsed, 'a/b');
  });

  it('should update parser.input as input is parsed', function() {
    parser.capture('all', /^.+/, function(tok) {
      return this.node(tok);
    });

    parser.parse('a/b');
    assert.equal(parser.input, 'a/b');
    assert.equal(parser.string, '');
  });

  it('should throw an error when a closing delimiter is missing', function() {
    parser.lexer
      .capture('brace.open', /^\{/)
      .capture('text', /^[^{}]+/)
      .capture('rbrace', /^\}/);

    parser
      .capture('text', (tok) => parser.node(tok))
      .capture('brace.open', function(tok) {
        var node = this.node({type: 'brace', nodes: []});
        node.push(this.node(tok));
        return node;
      })
      .capture('rbrace', function(tok) {
        return parser.node(tok);
      });

    assert.throws(() => parser.parse('{a,b}'), /unclosed/);
  });

  it('should close when node.isClose matches a node', function() {
    parser
      .capture('text', /^[^{}]+/)
      .capture('lbrace', /^\{/, function(node) {
        return {
          type: 'brace',
          nodes: [node],
          isOpen: node => node.type === 'lbrace',
          isClose: node => node.type === 'rbrace'
        };
      })
      .capture('rbrace', /^\}/);

    assert.doesNotThrow(() => parser.parse('{a,b,c}'));
    assert.doesNotThrow(() => parser.parse('{a,b}'));
  });
});
